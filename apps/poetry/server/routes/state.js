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
const paths = require('../services/paths');

function statePath(articleId) {
  return path.join(paths.STATE_ROOT, `${articleId}.json`);
}

function eventsPath(articleId) {
  return path.join(paths.STATE_ROOT, `${articleId}.events.jsonl`);
}

function readEvents(articleId) {
  const fp = eventsPath(articleId);
  try {
    const raw = fs.readFileSync(fp, 'utf-8');
    return raw.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
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

  res.json({ due: sorted, today });
});

// GET /api/state/:articleId
router.get('/api/state/:articleId', (req, res) => {
  const { articleId } = req.params;
  const state = readJson(statePath(articleId));
  if (!state) {
    return res.status(404).json({ error: `Article '${articleId}' not found` });
  }
  const events = readEvents(articleId);
  res.json({ state, events });
});

// POST /api/state/:articleId/complete
router.post('/api/state/:articleId/complete', (req, res) => {
  const { articleId } = req.params;
  const now = new Date().toISOString();
  const existing = readJson(statePath(articleId));

  let result;
  if (!existing) {
    // Start new article — requires meta in body
    const { collection, title, charCount, genre } = req.body || {};
    if (!collection || !title || charCount == null) {
      return res.status(400).json({
        error: 'Starting a new article requires: collection, title, charCount (and optionally genre)',
      });
    }
    result = startArticle(null, { articleId, collection, title, charCount, genre }, now);
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

  res.json({ state: result.nextState, events: result.events });
});

// POST /api/state/:articleId/defer
router.post('/api/state/:articleId/defer', (req, res) => {
  const { articleId } = req.params;
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

  res.json({ state: result.nextState, events: result.events });
});

module.exports = router;
