/**
 * Config API routes.
 * PUT /api/config/article/:articleId — override intervals/stages
 */
const express = require('express');
const router = express.Router();
const { readJson, writeJson, appendJsonl } = require('../services/storage');
const { applyConfigChange } = require('../services/stateMachine');
const { validateLevelConfig } = require('../services/difficultyDefaults');
const { withCurrentStage, isValidArticleId, statePath, eventsPath } = require('./helpers');

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
  const newConfig = { intervals, totalStages };

  // Critical validation: prevent active articles from entering an "orphaned" state
  // (status=active but nextDueDate=null) when intervals is shorter than totalStages.
  if (!validateLevelConfig(newConfig)) {
    return res.status(400).json({ error: 'Invalid config: intervals must be array of positive numbers with length >= totalStages' });
  }

  const now = new Date().toISOString();
  const result = applyConfigChange(existing, { intervals, totalStages }, now);

  // Per-article override: mark as override so batch level-default apply won't overwrite
  result.nextState.scheduleSource = 'override';

  writeJson(statePath(articleId), result.nextState);
  for (const event of result.events) {
    appendJsonl(eventsPath(articleId), event);
  }

  res.json({ state: withCurrentStage(result.nextState), events: result.events });
});

module.exports = router;
