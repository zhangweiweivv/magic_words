const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  lengthScore,
  genreScore,
  computeDifficulty,
  recommendSchedule,
} = require('../services/difficulty');

describe('difficulty', () => {
  describe('lengthScore', () => {
    it('returns 1 for very short texts (<=20 chars)', () => {
      assert.strictEqual(lengthScore(10), 1);
      assert.strictEqual(lengthScore(20), 1);
    });

    it('returns 2 for short texts (21-50 chars)', () => {
      assert.strictEqual(lengthScore(21), 2);
      assert.strictEqual(lengthScore(50), 2);
    });

    it('returns 3 for medium texts (51-100 chars)', () => {
      assert.strictEqual(lengthScore(51), 3);
      assert.strictEqual(lengthScore(100), 3);
    });

    it('returns 4 for long texts (>100 chars)', () => {
      assert.strictEqual(lengthScore(101), 4);
      assert.strictEqual(lengthScore(500), 4);
    });
  });

  describe('genreScore', () => {
    it('returns 1 for 五言绝句', () => {
      assert.strictEqual(genreScore('五言绝句'), 1);
    });

    it('returns 2 for 七言绝句', () => {
      assert.strictEqual(genreScore('七言绝句'), 2);
    });

    it('returns 2 for 五言律诗', () => {
      assert.strictEqual(genreScore('五言律诗'), 2);
    });

    it('returns 3 for 七言律诗', () => {
      assert.strictEqual(genreScore('七言律诗'), 3);
    });

    it('returns 3 for 词', () => {
      assert.strictEqual(genreScore('词'), 3);
    });

    it('returns 4 for 文言文', () => {
      assert.strictEqual(genreScore('文言文'), 4);
    });

    it('returns 2 for unknown genre (default)', () => {
      assert.strictEqual(genreScore('其他'), 2);
      assert.strictEqual(genreScore(undefined), 2);
    });
  });

  describe('computeDifficulty', () => {
    it('computes difficulty from charCount + genre', () => {
      // short五言绝句: (1+1)/2 = 1
      assert.strictEqual(computeDifficulty({ charCount: 20, genre: '五言绝句' }), 1);
    });

    it('rounds to nearest integer', () => {
      // medium七言律诗: (3+3)/2 = 3
      assert.strictEqual(computeDifficulty({ charCount: 80, genre: '七言律诗' }), 3);
    });

    it('clamps to max 4', () => {
      assert.strictEqual(computeDifficulty({ charCount: 500, genre: '文言文' }), 4);
    });

    it('clamps to min 1', () => {
      assert.strictEqual(computeDifficulty({ charCount: 5, genre: '五言绝句' }), 1);
    });
  });

  describe('recommendSchedule', () => {
    it('returns 4 stages for difficulty 1', () => {
      const sched = recommendSchedule(1);
      assert.strictEqual(sched.totalStages, 4);
      assert.strictEqual(sched.intervals.length, 4);
    });

    it('returns 5 stages for difficulty 2', () => {
      const sched = recommendSchedule(2);
      assert.strictEqual(sched.totalStages, 5);
      assert.strictEqual(sched.intervals.length, 5);
    });

    it('returns 6 stages for difficulty 3', () => {
      const sched = recommendSchedule(3);
      assert.strictEqual(sched.totalStages, 6);
      assert.strictEqual(sched.intervals.length, 6);
    });

    it('returns 7 stages for difficulty 4', () => {
      const sched = recommendSchedule(4);
      assert.strictEqual(sched.totalStages, 7);
      assert.strictEqual(sched.intervals.length, 7);
    });

    it('intervals are non-decreasing', () => {
      for (let d = 1; d <= 4; d++) {
        const sched = recommendSchedule(d);
        for (let i = 1; i < sched.intervals.length; i++) {
          assert.ok(
            sched.intervals[i] >= sched.intervals[i - 1],
            `difficulty ${d}: interval[${i}]=${sched.intervals[i]} < interval[${i - 1}]=${sched.intervals[i - 1]}`
          );
        }
      }
    });
  });
});
