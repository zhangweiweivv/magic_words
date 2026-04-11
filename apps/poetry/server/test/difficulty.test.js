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
    it('returns 1 for short texts (<=50 chars)', () => {
      assert.strictEqual(lengthScore(10), 1);
      assert.strictEqual(lengthScore(50), 1);
    });

    it('returns 2 for medium texts (51-150 chars)', () => {
      assert.strictEqual(lengthScore(51), 2);
      assert.strictEqual(lengthScore(150), 2);
    });

    it('returns 3 for long texts (151-300 chars)', () => {
      assert.strictEqual(lengthScore(151), 3);
      assert.strictEqual(lengthScore(300), 3);
    });

    it('returns 4 for very long texts (>300 chars)', () => {
      assert.strictEqual(lengthScore(301), 4);
      assert.strictEqual(lengthScore(500), 4);
    });
  });

  describe('genreScore', () => {
    it('returns 1 for all poetry types (诗词)', () => {
      assert.strictEqual(genreScore('五言绝句'), 1);
      assert.strictEqual(genreScore('七言绝句'), 1);
      assert.strictEqual(genreScore('五言律诗'), 1);
      assert.strictEqual(genreScore('七言律诗'), 1);
      assert.strictEqual(genreScore('词'), 1);
      assert.strictEqual(genreScore('诗'), 1);
      assert.strictEqual(genreScore('诗词'), 1);
    });

    it('returns 2 for 唐宋古文', () => {
      assert.strictEqual(genreScore('古文_唐宋'), 2);
      assert.strictEqual(genreScore('唐宋古文'), 2);
      assert.strictEqual(genreScore('文言文'), 2); // legacy
    });

    it('returns 3 for 先秦古文', () => {
      assert.strictEqual(genreScore('古文_先秦'), 3);
      assert.strictEqual(genreScore('先秦古文'), 3);
    });

    it('returns 4 for 先秦诸子', () => {
      assert.strictEqual(genreScore('先秦诸子'), 4);
    });

    it('returns 1 for unknown genre (default)', () => {
      assert.strictEqual(genreScore('其他'), 1);
      assert.strictEqual(genreScore(undefined), 1);
    });
  });

  describe('computeDifficulty', () => {
    it('computes difficulty from charCount + genre', () => {
      // short poetry: (1+1)/2 = 1
      assert.strictEqual(computeDifficulty({ charCount: 50, genre: '五言绝句' }), 1);
    });

    it('rounds to nearest integer', () => {
      // 151-300 chars (3) + 唐宋古文 (2): (3+2)/2 = 2.5 -> 3
      assert.strictEqual(computeDifficulty({ charCount: 200, genre: '唐宋古文' }), 3);
    });

    it('handles mixed difficulty factors', () => {
      // 51-150 chars (2) + 先秦诸子 (4): (2+4)/2 = 3
      assert.strictEqual(computeDifficulty({ charCount: 100, genre: '先秦诸子' }), 3);
    });

    it('clamps to max 4', () => {
      assert.strictEqual(computeDifficulty({ charCount: 500, genre: '先秦诸子' }), 4);
    });

    it('clamps to min 1', () => {
      assert.strictEqual(computeDifficulty({ charCount: 5, genre: '五言绝句' }), 1);
    });
  });

  describe('recommendSchedule', () => {
    it('returns 3 stages with intervals [1,2,5] for difficulty 1', () => {
      const sched = recommendSchedule(1);
      assert.strictEqual(sched.totalStages, 3);
      assert.deepStrictEqual(sched.intervals, [1, 2, 5]);
    });

    it('returns 3 stages with intervals [1,3,7] for difficulty 2', () => {
      const sched = recommendSchedule(2);
      assert.strictEqual(sched.totalStages, 3);
      assert.deepStrictEqual(sched.intervals, [1, 3, 7]);
    });

    it('returns 4 stages with intervals [1,3,7,14] for difficulty 3', () => {
      const sched = recommendSchedule(3);
      assert.strictEqual(sched.totalStages, 4);
      assert.deepStrictEqual(sched.intervals, [1, 3, 7, 14]);
    });

    it('returns 5 stages with intervals [2,4,7,14,21] for difficulty 4', () => {
      const sched = recommendSchedule(4);
      assert.strictEqual(sched.totalStages, 5);
      assert.deepStrictEqual(sched.intervals, [2, 4, 7, 14, 21]);
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

    it('falls back to difficulty 2 for unknown difficulty', () => {
      const sched = recommendSchedule(99);
      assert.strictEqual(sched.totalStages, 3);
      assert.deepStrictEqual(sched.intervals, [1, 3, 7]);
    });
  });
});
