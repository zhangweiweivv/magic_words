/**
 * State API routes.
 * GET  /api/state/due                    — today's due list
 * GET  /api/state/:articleId             — article detail + history
 * POST /api/state/:articleId/complete    — mark complete / start new
 * POST /api/state/:articleId/defer       — defer to tomorrow
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { readJson, writeJson, appendJsonl } = require('../services/storage');
const { startArticle, completeStage, deferArticle } = require('../services/stateMachine');
const { getDueArticles, sortDueArticles } = require('../services/scheduler');
const { notifyArticleComplete } = require('../services/slack');
const { parseCollection } = require('../services/catalog');
const paths = require('../services/paths');
const { advanceCursorAfterSelection } = require('../services/rotation');
const { withCurrentStage, isValidArticleId, statePath, eventsPath } = require('./helpers');

/**
 * Look up article metadata from the catalog by articleId.
 * ArticleId format: "{collection}-{number}", e.g. "寅集-01".
 * @param {string} articleId
 * @returns {{ collection: string, title: string, charCount: number, genre: string|undefined }|null}
 */
function lookupArticleMeta(articleId) {
  // Parse collection name from articleId (e.g., "寅集-01" → "寅集")
  const dashIdx = articleId.lastIndexOf('-');
  if (dashIdx === -1) return null;
  const collectionName = articleId.slice(0, dashIdx);

  const result = parseCollection(collectionName);
  if (!result || !result.articles) return null;

  const article = result.articles.find(a => a.articleId === articleId);
  if (!article) return null;

  return {
    collection: collectionName,
    title: article.title,
    section: article.section,
  };
}

function readEvents(articleId) {
  const fp = eventsPath(articleId);
  try {
    const raw = fs.readFileSync(fp, 'utf-8');
    const events = [];
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        events.push(JSON.parse(trimmed));
      } catch {
        // Skip malformed lines (e.g. partial writes)
      }
    }
    return events;
  } catch {
    return [];
  }
}

// GET /api/state/due
router.get('/api/state/due', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  // Read all state files
  let files;
  try {
    fs.mkdirSync(paths.STATE_ROOT, { recursive: true });
    files = fs.readdirSync(paths.STATE_ROOT).filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'));
  } catch {
    files = [];
  }

  const states = files.map(f => readJson(path.join(paths.STATE_ROOT, f))).filter(Boolean);
  const due = getDueArticles({ today, states });
  const sorted = sortDueArticles(due);

  res.json({ due: sorted.map(withCurrentStage), today });
});

// GET /api/state/current
router.get('/api/state/current', (_req, res) => {
  let files;
  try {
    fs.mkdirSync(paths.STATE_ROOT, { recursive: true });
    files = fs.readdirSync(paths.STATE_ROOT).filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'));
  } catch {
    files = [];
  }

  const states = files
    .map(f => readJson(path.join(paths.STATE_ROOT, f)))
    .filter(Boolean)
    .filter(s => s.status === 'active');

  if (states.length === 0) {
    return res.json({ current: null });
  }

  // Most recently active = latest lastCompletedAt, fallback to startedAt.
  states.sort((a, b) => {
    const ta = a.lastCompletedAt || a.startedAt || '';
    const tb = b.lastCompletedAt || b.startedAt || '';
    return String(tb).localeCompare(String(ta));
  });

  res.json({ current: withCurrentStage(states[0]) });
});

// GET /api/state/:articleId
router.get('/api/state/:articleId', (req, res) => {
  const { articleId } = req.params;
  if (!isValidArticleId(articleId)) {
    return res.status(400).json({ error: 'Invalid articleId' });
  }
  const state = readJson(statePath(articleId));
  if (!state) {
    return res.status(404).json({ error: `Article '${articleId}' not found` });
  }
  const events = readEvents(articleId);
  res.json({ state: withCurrentStage(state), events });
});

// POST /api/state/:articleId/complete
router.post('/api/state/:articleId/complete', (req, res) => {
  const { articleId } = req.params;
  if (!isValidArticleId(articleId)) {
    return res.status(400).json({ error: 'Invalid articleId' });
  }
  const now = new Date().toISOString();
  const existing = readJson(statePath(articleId));

  let result;
  if (!existing) {
    // Start new article — try body first, then catalog lookup
    let { collection, title, charCount, genre } = req.body || {};

    // Auto-lookup from catalog if meta not fully provided
    let catalogMeta = null;
    if (!collection || !title) {
      catalogMeta = lookupArticleMeta(articleId);
      if (catalogMeta) {
        collection = collection || catalogMeta.collection;
        title = title || catalogMeta.title;
      }
    } else {
      // Even if body provided, try to resolve section for cursor advance
      catalogMeta = lookupArticleMeta(articleId);
    }

    if (!collection || !title) {
      return res.status(400).json({
        error: 'Starting a new article requires: collection, title, charCount (and optionally genre). Could not auto-resolve from catalog.',
      });
    }

    // charCount defaults to 0 if not provided (catalog doesn't have it)
    if (charCount == null) charCount = 0;

    result = startArticle(null, { articleId, collection, title, charCount, genre }, now);

    // Stable recommendation mode: advance rotation cursor ONLY when user actually starts learning.
    // Advance to the topic after the started article's topic (if known).
    const parsed = parseCollection(collection);
    if (parsed && parsed.articles && catalogMeta && catalogMeta.section) {
      const catalog = {};
      for (const a of parsed.articles) {
        const topic = a.section || '未分类';
        if (!catalog[topic]) catalog[topic] = [];
        catalog[topic].push({ articleId: a.articleId, topic, title: a.title });
      }
      const cursorFile = path.join(paths.STATE_ROOT, '_rotation_cursor.json');
      advanceCursorAfterSelection({
        collection,
        catalog,
        cursorFile,
        selectedTopic: catalogMeta.section || '未分类',
      });
    }
  } else {
    if (existing.status === 'graduated') {
      return res.status(400).json({ error: 'Article is already graduated' });
    }
    result = completeStage(existing, now);
  }

  // Persist
  writeJson(statePath(articleId), result.nextState);
  for (const event of result.events) {
    appendJsonl(eventsPath(articleId), event);
  }

  // Fire-and-forget Slack notification
  notifyArticleComplete(result.nextState, result.events).catch((err) =>
    console.error('[poetry:slack] notification error:', err.message)
  );

  res.json({ state: withCurrentStage(result.nextState), events: result.events });
});

// POST /api/state/:articleId/defer
router.post('/api/state/:articleId/defer', (req, res) => {
  const { articleId } = req.params;
  if (!isValidArticleId(articleId)) {
    return res.status(400).json({ error: 'Invalid articleId' });
  }
  const existing = readJson(statePath(articleId));
  if (!existing) {
    return res.status(404).json({ error: `Article '${articleId}' not found` });
  }
  if (existing.status !== 'active') {
    return res.status(400).json({ error: `Cannot defer article with status '${existing.status}'` });
  }

  const today = new Date().toISOString().slice(0, 10);
  const result = deferArticle(existing, today);

  writeJson(statePath(articleId), result.nextState);
  for (const event of result.events) {
    appendJsonl(eventsPath(articleId), event);
  }

  res.json({ state: withCurrentStage(result.nextState), events: result.events });
});

module.exports = router;
