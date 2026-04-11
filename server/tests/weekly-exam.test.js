const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// We test pure functions exported by weeklyExam.js
const {
  getExamCycleDate,
  isWithinWindow,
  pickQuestionType,
  seededRng,
  generateHintMask,
  fisherYatesShuffle,
} = require('../services/weeklyExam');

describe('getExamCycleDate', () => {
  it('returns same day if today is examDay', () => {
    // 2026-04-11 is Saturday (day 6)
    const result = getExamCycleDate(new Date('2026-04-11T10:00:00+08:00'), 6);
    assert.strictEqual(result, '2026-04-11');
  });

  it('returns previous Saturday when today is Sunday', () => {
    // 2026-04-12 is Sunday (day 0)
    const result = getExamCycleDate(new Date('2026-04-12T10:00:00+08:00'), 6);
    assert.strictEqual(result, '2026-04-11');
  });

  it('returns previous Saturday when today is Friday', () => {
    // 2026-04-10 is Friday (day 5)
    const result = getExamCycleDate(new Date('2026-04-10T10:00:00+08:00'), 6);
    assert.strictEqual(result, '2026-04-04');
  });

  it('returns previous Saturday when today is Monday', () => {
    // 2026-04-06 is Monday (day 1)
    const result = getExamCycleDate(new Date('2026-04-06T10:00:00+08:00'), 6);
    assert.strictEqual(result, '2026-04-04');
  });

  it('works with examDay=0 (Sunday)', () => {
    // 2026-04-12 is Sunday
    const result = getExamCycleDate(new Date('2026-04-12T10:00:00+08:00'), 0);
    assert.strictEqual(result, '2026-04-12');
    // Monday after
    const result2 = getExamCycleDate(new Date('2026-04-13T10:00:00+08:00'), 0);
    assert.strictEqual(result2, '2026-04-12');
  });
});

describe('isWithinWindow', () => {
  it('includes word graduated on cycleDate', () => {
    assert.strictEqual(isWithinWindow('2026-04-11', '2026-04-11', 1), true);
  });

  it('includes word graduated 6 days before cycleDate (windowWeeks=1)', () => {
    assert.strictEqual(isWithinWindow('2026-04-05', '2026-04-11', 1), true);
  });

  it('excludes word graduated 8 days before cycleDate (windowWeeks=1)', () => {
    assert.strictEqual(isWithinWindow('2026-04-03', '2026-04-11', 1), false);
  });

  it('includes word graduated 13 days before with windowWeeks=2', () => {
    assert.strictEqual(isWithinWindow('2026-03-29', '2026-04-11', 2), true);
  });

  it('excludes word graduated 15 days before with windowWeeks=2', () => {
    assert.strictEqual(isWithinWindow('2026-03-27', '2026-04-11', 2), false);
  });

  it('returns false for null/undefined graduatedDate', () => {
    assert.strictEqual(isWithinWindow(null, '2026-04-11', 1), false);
    assert.strictEqual(isWithinWindow(undefined, '2026-04-11', 1), false);
  });
});

describe('seededRng', () => {
  it('produces deterministic output for same seed', () => {
    const rng1 = seededRng('2026-04-11');
    const rng2 = seededRng('2026-04-11');
    const vals1 = Array.from({ length: 5 }, () => rng1());
    const vals2 = Array.from({ length: 5 }, () => rng2());
    assert.deepStrictEqual(vals1, vals2);
  });

  it('produces different output for different seeds', () => {
    const rng1 = seededRng('2026-04-11');
    const rng2 = seededRng('2026-04-04');
    const vals1 = Array.from({ length: 5 }, () => rng1());
    const vals2 = Array.from({ length: 5 }, () => rng2());
    // Very unlikely to be equal
    assert.notDeepStrictEqual(vals1, vals2);
  });

  it('returns values in [0, 1)', () => {
    const rng = seededRng('test-seed');
    for (let i = 0; i < 100; i++) {
      const v = rng();
      assert.ok(v >= 0 && v < 1, `value ${v} out of range`);
    }
  });
});

describe('pickQuestionType', () => {
  it('returns one of choice/fillBlank/spelling', () => {
    const ratios = { choice: 30, fillBlank: 40, spelling: 30 };
    const rng = seededRng('test');
    const result = pickQuestionType(ratios, rng);
    assert.ok(['choice', 'fillBlank', 'spelling'].includes(result));
  });

  it('returns spelling when spelling=100', () => {
    const ratios = { choice: 0, fillBlank: 0, spelling: 100 };
    const rng = seededRng('test');
    for (let i = 0; i < 10; i++) {
      assert.strictEqual(pickQuestionType(ratios, rng), 'spelling');
    }
  });

  it('returns choice when choice=100', () => {
    const ratios = { choice: 100, fillBlank: 0, spelling: 0 };
    const rng = seededRng('test');
    for (let i = 0; i < 10; i++) {
      assert.strictEqual(pickQuestionType(ratios, rng), 'choice');
    }
  });
});

describe('generateHintMask', () => {
  it('shows first letter and hides some chars deterministically', () => {
    const rng = seededRng('hint-test');
    const mask = generateHintMask('apple', rng);
    // First char visible
    assert.strictEqual(mask[0], 'a');
    // Contains underscores
    assert.ok(mask.includes('_'), `mask "${mask}" should contain underscores`);
    // Same length
    assert.strictEqual(mask.length, 'apple'.length);
  });

  it('is deterministic with same rng seed', () => {
    const rng1 = seededRng('hint-det');
    const rng2 = seededRng('hint-det');
    const mask1 = generateHintMask('apple', rng1);
    const mask2 = generateHintMask('apple', rng2);
    assert.strictEqual(mask1, mask2);
  });

  it('handles single character', () => {
    const rng = seededRng('single');
    const mask = generateHintMask('a', rng);
    assert.strictEqual(mask, 'a');
  });

  it('handles two characters', () => {
    const rng = seededRng('two');
    const mask = generateHintMask('go', rng);
    assert.strictEqual(mask[0], 'g');
    assert.strictEqual(mask.length, 2);
  });
});

describe('fisherYatesShuffle', () => {
  it('returns array of same length with same elements', () => {
    const rng = seededRng('shuffle');
    const input = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle(input, rng);
    assert.strictEqual(result.length, input.length);
    assert.deepStrictEqual([...result].sort(), [...input].sort());
  });

  it('does not mutate the original array', () => {
    const rng = seededRng('shuffle-no-mutate');
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    fisherYatesShuffle(input, rng);
    assert.deepStrictEqual(input, copy);
  });

  it('is deterministic with same rng seed', () => {
    const rng1 = seededRng('shuffle-det');
    const rng2 = seededRng('shuffle-det');
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result1 = fisherYatesShuffle(input, rng1);
    const result2 = fisherYatesShuffle(input, rng2);
    assert.deepStrictEqual(result1, result2);
  });

  it('handles empty array', () => {
    const rng = seededRng('empty');
    assert.deepStrictEqual(fisherYatesShuffle([], rng), []);
  });

  it('handles single element', () => {
    const rng = seededRng('single');
    assert.deepStrictEqual(fisherYatesShuffle([42], rng), [42]);
  });
});
