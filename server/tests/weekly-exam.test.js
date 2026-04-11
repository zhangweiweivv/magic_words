const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// We test pure functions exported by weeklyExam.js
const {
  getExamCycleDate,
  isWithinWindow,
  pickQuestionType,
  seededRng,
  generateHintMask,
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
  it('shows first letter and hides roughly 50%', () => {
    const mask = generateHintMask('apple');
    // First char visible
    assert.strictEqual(mask[0], 'a');
    // Contains underscores
    assert.ok(mask.includes('_'), `mask "${mask}" should contain underscores`);
    // Same length
    assert.strictEqual(mask.length, 'apple'.length);
  });

  it('handles single character', () => {
    const mask = generateHintMask('a');
    assert.strictEqual(mask, 'a');
  });

  it('handles two characters', () => {
    const mask = generateHintMask('go');
    assert.strictEqual(mask[0], 'g');
    assert.strictEqual(mask.length, 2);
  });
});
