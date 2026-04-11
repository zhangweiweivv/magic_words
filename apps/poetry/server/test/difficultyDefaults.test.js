/**
 * Tests for difficultyDefaults service.
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Create temp dir and override paths
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'poetry-defaults-test-'));
const stateRoot = path.join(tmpDir, '可可古诗文');
fs.mkdirSync(stateRoot, { recursive: true });

const pathsMod = require('../services/paths');
pathsMod.STATE_ROOT = stateRoot;

const {
  HARDCODED_DEFAULTS,
  readDifficultyDefaults,
  writeDifficultyDefaults,
  validateLevelConfig,
} = require('../services/difficultyDefaults');

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('difficultyDefaults', () => {
  describe('validateLevelConfig', () => {
    it('accepts valid config', () => {
      assert.ok(validateLevelConfig({ totalStages: 3, intervals: [1, 2, 5] }));
    });

    it('rejects intervals shorter than totalStages', () => {
      assert.ok(!validateLevelConfig({ totalStages: 5, intervals: [1, 2] }));
    });

    it('rejects non-positive intervals', () => {
      assert.ok(!validateLevelConfig({ totalStages: 2, intervals: [1, -1] }));
    });

    it('rejects non-array intervals', () => {
      assert.ok(!validateLevelConfig({ totalStages: 2, intervals: 'bad' }));
    });

    it('rejects totalStages < 1', () => {
      assert.ok(!validateLevelConfig({ totalStages: 0, intervals: [1] }));
    });
  });

  describe('readDifficultyDefaults', () => {
    it('returns hardcoded defaults when file is missing', () => {
      const defaults = readDifficultyDefaults();
      assert.deepEqual(defaults[1], HARDCODED_DEFAULTS[1]);
      assert.deepEqual(defaults[2], HARDCODED_DEFAULTS[2]);
      assert.deepEqual(defaults[3], HARDCODED_DEFAULTS[3]);
      assert.deepEqual(defaults[4], HARDCODED_DEFAULTS[4]);
    });

    it('returns persisted defaults after write', () => {
      const custom = {
        1: { totalStages: 4, intervals: [1, 2, 5, 10] },
        2: { totalStages: 3, intervals: [1, 3, 7] },
        3: { totalStages: 4, intervals: [1, 3, 7, 14] },
        4: { totalStages: 5, intervals: [2, 4, 7, 14, 21] },
      };
      writeDifficultyDefaults(custom);
      const result = readDifficultyDefaults();
      assert.deepEqual(result[1], custom[1]);
    });

    it('falls back per-level if a level config is invalid', () => {
      // Write invalid config for level 1
      const filePath = path.join(stateRoot, '_difficulty_defaults.json');
      fs.writeFileSync(filePath, JSON.stringify({
        1: { totalStages: 5, intervals: [1] }, // invalid: intervals < totalStages
        2: { totalStages: 3, intervals: [1, 3, 7] },
        3: { totalStages: 4, intervals: [1, 3, 7, 14] },
        4: { totalStages: 5, intervals: [2, 4, 7, 14, 21] },
      }), 'utf-8');

      const result = readDifficultyDefaults();
      // Level 1 should fall back to hardcoded
      assert.deepEqual(result[1], HARDCODED_DEFAULTS[1]);
      // Level 2 should use persisted
      assert.deepEqual(result[2], { totalStages: 3, intervals: [1, 3, 7] });
    });
  });

  describe('writeDifficultyDefaults', () => {
    it('throws on invalid config', () => {
      assert.throws(() => {
        writeDifficultyDefaults({
          1: { totalStages: 10, intervals: [1] },
        });
      });
    });
  });
});
