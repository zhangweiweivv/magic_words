/**
 * Persisted difficulty defaults service.
 * 
 * Reads/writes difficulty level defaults from STATE_ROOT/_difficulty_defaults.json.
 * Falls back to hardcoded defaults when file is missing or invalid.
 */
const path = require('path');
const { readJson, writeJson } = require('./storage');
const paths = require('./paths');

/** Hardcoded fallback schedules (same as original difficulty.js) */
const HARDCODED_DEFAULTS = {
  1: { totalStages: 3, intervals: [1, 2, 5] },
  2: { totalStages: 3, intervals: [1, 3, 7] },
  3: { totalStages: 4, intervals: [1, 3, 7, 14] },
  4: { totalStages: 5, intervals: [2, 4, 7, 14, 21] },
};

function defaultsPath() {
  return path.join(paths.STATE_ROOT, '_difficulty_defaults.json');
}

/**
 * Validate a single level config: intervals must be array of positive numbers
 * with length >= totalStages.
 */
function validateLevelConfig(config) {
  if (!config || typeof config !== 'object') return false;
  if (typeof config.totalStages !== 'number' || config.totalStages < 1) return false;
  if (!Array.isArray(config.intervals)) return false;
  if (!config.intervals.every(n => typeof n === 'number' && n > 0)) return false;
  if (config.intervals.length < config.totalStages) return false;
  return true;
}

/**
 * Read persisted difficulty defaults. Falls back to hardcoded if missing/invalid.
 * @returns {Object} map of difficulty level (1-4) to { totalStages, intervals }
 */
function readDifficultyDefaults() {
  const persisted = readJson(defaultsPath(), null);
  if (!persisted || typeof persisted !== 'object') {
    return { ...HARDCODED_DEFAULTS };
  }

  // Validate each level; fall back per-level if invalid
  const result = {};
  for (const level of [1, 2, 3, 4]) {
    const key = String(level);
    if (persisted[key] && validateLevelConfig(persisted[key])) {
      result[level] = { ...persisted[key] };
    } else {
      result[level] = { ...HARDCODED_DEFAULTS[level] };
    }
  }
  return result;
}

/**
 * Write difficulty defaults to disk. Validates before writing.
 * @param {Object} defaults - map of level to { totalStages, intervals }
 * @throws {Error} if any level config is invalid
 */
function writeDifficultyDefaults(defaults) {
  if (!defaults || typeof defaults !== 'object') {
    throw new Error('defaults must be an object');
  }
  for (const level of [1, 2, 3, 4]) {
    const key = String(level);
    if (defaults[key] && !validateLevelConfig(defaults[key])) {
      throw new Error(`Invalid config for level ${level}: intervals.length must be >= totalStages`);
    }
  }
  writeJson(defaultsPath(), defaults);
}

module.exports = {
  HARDCODED_DEFAULTS,
  readDifficultyDefaults,
  writeDifficultyDefaults,
  validateLevelConfig,
  defaultsPath,
};
