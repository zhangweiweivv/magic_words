/**
 * Config API routes.
 * PUT /api/config/article/:articleId — override intervals/stages
 */
const express = require('express');
const path = require('path');
const router = express.Router();
const { readJson, writeJson, appendJsonl } = require('../services/storage');
const { applyConfigChange } = require('../services/stateMachine');
const paths = require('../services/paths');

/**
 * Add currentStage alias (= stage + 1) to state object for client compatibility.
 */
function withCurrentStage(state) {
  if (!state) return state;
  return { ...state, currentStage: state.stage + 1 };
}

/**
 * Validate articleId to prevent path traversal.
 */
function isValidArticleId(id) {
  if (!id || typeof id !== 'string') return false;
  if (id.length > 100) return false;
  if (/[\/\\]/.test(id)) return false;
  if (id.includes('..')) return false;
  if (id.includes('\0')) return false;
  return true;
}

function statePath(articleId) {
  return path.join(paths.STATE_ROOT, `${articleId}.json`);
}

function eventsPath(articleId) {
  return path.join(paths.STATE_ROOT, `${articleId}.events.jsonl`);
}

// PUT /api/config/article/:articleId
router.put('/api/config/article/:articleId', (req, res) => {
  const { articleId } = req.params;
  if (!isValidArticleId(articleId)) {
    return res.status(400).json({ error: 'Invalid articleId' });
  }
  const existing = readJson(statePath(articleId));
  if (!existing) {
    return res.status(404).json({ error: `Article '${articleId}' not found` });
  }

  const { intervals, totalStages } = req.body || {};
  if (!Array.isArray(intervals) || !intervals.every(n => typeof n === 'number' && n > 0)) {
    return res.status(400).json({ error: 'intervals must be an array of positive numbers' });
  }
  if (typeof totalStages !== 'number' || totalStages < 1) {
    return res.status(400).json({ error: 'totalStages must be a positive number' });
  }

  const now = new Date().toISOString();
  const result = applyConfigChange(existing, { intervals, totalStages }, now);

  writeJson(statePath(articleId), result.nextState);
  for (const event of result.events) {
    appendJsonl(eventsPath(articleId), event);
  }

  res.json({ state: withCurrentStage(result.nextState), events: result.events });
});

module.exports = router;
