/**
 * Admin API routes for parent center advanced features.
 * 
 * GET  /api/admin/difficulty/rules       - read current difficulty defaults
 * GET  /api/admin/collections            - list all collections
 * GET  /api/admin/collection/:collection/articles - list articles w/ difficulty info
 * PUT  /api/admin/difficulty/:level      - update level defaults (optional batch apply)
 * PUT  /api/admin/article/:articleId/override        - per-article schedule override
 * PUT  /api/admin/article/:articleId/reset-to-default - reset to level default
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { readJson, writeJson, appendJsonl } = require('../services/storage');
const { readDifficultyDefaults, writeDifficultyDefaults, validateLevelConfig } = require('../services/difficultyDefaults');
const { computeDifficulty } = require('../services/difficulty');
const { applyConfigChange } = require('../services/stateMachine');
const { listCollections, parseCollection } = require('../services/catalog');
const { isValidArticleId, statePath, eventsPath, withCurrentStage } = require('./helpers');
const { buildArticleSummary } = require('../services/articleSummary');
const paths = require('../services/paths');

// ── Read-only APIs ──────────────────────────────────────────

// GET /api/admin/difficulty/rules
router.get('/api/admin/difficulty/rules', (_req, res) => {
  const defaults = readDifficultyDefaults();
  res.json({ defaults });
});

// GET /api/admin/collections
router.get('/api/admin/collections', (_req, res) => {
  const collections = listCollections();
  res.json({ collections });
});

// GET /api/admin/collection/:collection/articles
router.get('/api/admin/collection/:collection/articles', (req, res) => {
  const { collection } = req.params;
  const parsed = parseCollection(collection);
  if (!parsed) {
    return res.status(404).json({ error: `Collection '${collection}' not found` });
  }

  // Enrich each article with state info via shared summary builder
  const enriched = parsed.articles.map(article => {
    const state = readJson(statePath(article.articleId), null);
    return buildArticleSummary({ article, state });
  });

  res.json({ collection, articles: enriched });
});

// ── Write APIs ──────────────────────────────────────────

// PUT /api/admin/difficulty/:level
router.put('/api/admin/difficulty/:level', (req, res) => {
  const level = parseInt(req.params.level, 10);
  if (![1, 2, 3, 4].includes(level)) {
    return res.status(400).json({ error: 'level must be 1-4' });
  }

  const { totalStages, intervals, applyToExisting } = req.body || {};
  const newConfig = { totalStages, intervals };

  if (!validateLevelConfig(newConfig)) {
    return res.status(400).json({ error: 'Invalid config: intervals must be array of positive numbers with length >= totalStages' });
  }

  // Read current defaults and update this level
  const defaults = readDifficultyDefaults();
  defaults[level] = { totalStages, intervals };

  try {
    writeDifficultyDefaults(defaults);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  let updatedCount = 0;
  let skippedOverrides = 0;

  // If applyToExisting, update all active states with this difficulty level + scheduleSource='level_default'
  if (applyToExisting) {
    const now = new Date().toISOString();
    const stateFiles = listStateFiles();
    for (const file of stateFiles) {
      const filePath = path.join(paths.STATE_ROOT, file);
      const state = readJson(filePath, null);
      if (!state) continue;
      if (state.difficulty !== level) continue;

      // CRITICAL: never overwrite override states
      const source = state.scheduleSource || 'level_default';
      if (source === 'override') {
        skippedOverrides++;
        continue;
      }

      const result = applyConfigChange(state, { intervals, totalStages }, now);
      result.nextState.scheduleSource = 'level_default';
      writeJson(filePath, result.nextState);
      for (const event of result.events) {
        const articleEventsPath = eventsPath(state.articleId);
        appendJsonl(articleEventsPath, event);
      }
      updatedCount++;
    }
  }

  res.json({
    defaults: defaults[level],
    applied: applyToExisting ? { updatedCount, skippedOverrides } : null,
  });
});

// PUT /api/admin/article/:articleId/override
router.put('/api/admin/article/:articleId/override', (req, res) => {
  const { articleId } = req.params;
  if (!isValidArticleId(articleId)) {
    return res.status(400).json({ error: 'Invalid articleId' });
  }
  const existing = readJson(statePath(articleId));
  if (!existing) {
    return res.status(404).json({ error: `Article '${articleId}' not found` });
  }

  const { intervals, totalStages } = req.body || {};
  const newConfig = { intervals, totalStages };

  if (!validateLevelConfig(newConfig)) {
    return res.status(400).json({ error: 'Invalid config: intervals must be array of positive numbers with length >= totalStages' });
  }

  const now = new Date().toISOString();
  const result = applyConfigChange(existing, { intervals, totalStages }, now);
  result.nextState.scheduleSource = 'override';

  writeJson(statePath(articleId), result.nextState);
  for (const event of result.events) {
    appendJsonl(eventsPath(articleId), event);
  }

  res.json({ state: withCurrentStage(result.nextState), events: result.events });
});

// PUT /api/admin/article/:articleId/reset-to-default
router.put('/api/admin/article/:articleId/reset-to-default', (req, res) => {
  const { articleId } = req.params;
  if (!isValidArticleId(articleId)) {
    return res.status(400).json({ error: 'Invalid articleId' });
  }
  const existing = readJson(statePath(articleId));
  if (!existing) {
    return res.status(404).json({ error: `Article '${articleId}' not found` });
  }

  // Look up the default for this article's difficulty level
  const defaults = readDifficultyDefaults();
  const difficulty = existing.difficulty || 2;
  const defaultConfig = defaults[difficulty] || defaults[2];

  const now = new Date().toISOString();
  const result = applyConfigChange(existing, { intervals: defaultConfig.intervals, totalStages: defaultConfig.totalStages }, now);
  result.nextState.scheduleSource = 'level_default';

  writeJson(statePath(articleId), result.nextState);
  for (const event of result.events) {
    appendJsonl(eventsPath(articleId), event);
  }

  res.json({ state: withCurrentStage(result.nextState), events: result.events });
});

/**
 * List all state JSON files in STATE_ROOT (excludes events, defaults, etc.)
 */
function listStateFiles() {
  try {
    return fs.readdirSync(paths.STATE_ROOT)
      .filter(f => f.endsWith('.json') && !f.startsWith('_') && !f.endsWith('.tmp'));
  } catch {
    return [];
  }
}

module.exports = router;
