/**
 * Shared helpers for API route handlers.
 * Extracts common utilities previously duplicated across state.js and config.js.
 */
const path = require('path');
const paths = require('../services/paths');

/**
 * Add currentStage alias (= stage + 1, human-readable "第N轮") to state object.
 * Client templates expect currentStage; server stores 0-based stage.
 */
function withCurrentStage(state) {
  if (!state) return state;
  return { ...state, currentStage: state.stage + 1 };
}

/**
 * Validate articleId to prevent path traversal attacks.
 * Only allows: Unicode word chars, hyphens, digits.
 * Rejects: .., /, \, null bytes, etc.
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

module.exports = { withCurrentStage, isValidArticleId, statePath, eventsPath };
