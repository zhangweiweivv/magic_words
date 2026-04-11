const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  computeNextDueDate,
  getDueArticles,
  sortDueArticles,
} = require('../services/scheduler');

describe('scheduler', () => {
  describe('computeNextDueDate', () => {
    it('adds interval days to completedAt date', () => {
      const result = computeNextDueDate({
        completedAt: '2026-04-01',
        nextStage: 1,
        intervals: [1, 2, 4, 7, 14],
      });
      assert.strictEqual(result, '2026-04-03'); // +2 days (intervals[1])
    });

    it('uses first interval for stage 0', () => {
      const result = computeNextDueDate({
        completedAt: '2026-04-01',
        nextStage: 0,
        intervals: [1, 2, 4],
      });
      assert.strictEqual(result, '2026-04-02'); // +1 day
    });

    it('returns null when nextStage >= intervals length (graduated)', () => {
      const result = computeNextDueDate({
        completedAt: '2026-04-01',
        nextStage: 3,
        intervals: [1, 2, 4],
      });
      assert.strictEqual(result, null);
    });
  });

  describe('getDueArticles', () => {
    it('returns articles due today', () => {
      const states = [
        { articleId: 'a', status: 'active', nextDueDate: '2026-04-10', stage: 1, totalStages: 5 },
      ];
      const due = getDueArticles({ today: '2026-04-10', states });
      assert.strictEqual(due.length, 1);
      assert.strictEqual(due[0].articleId, 'a');
      assert.strictEqual(due[0].overdueDays, 0);
    });

    it('returns overdue articles with correct overdueDays', () => {
      const states = [
        { articleId: 'a', status: 'active', nextDueDate: '2026-04-08', stage: 2, totalStages: 5 },
      ];
      const due = getDueArticles({ today: '2026-04-10', states });
      assert.strictEqual(due.length, 1);
      assert.strictEqual(due[0].overdueDays, 2);
    });

    it('excludes graduated articles', () => {
      const states = [
        { articleId: 'a', status: 'graduated', nextDueDate: '2026-04-10', stage: 5, totalStages: 5 },
      ];
      const due = getDueArticles({ today: '2026-04-10', states });
      assert.strictEqual(due.length, 0);
    });

    it('excludes future articles', () => {
      const states = [
        { articleId: 'a', status: 'active', nextDueDate: '2026-04-12', stage: 1, totalStages: 5 },
      ];
      const due = getDueArticles({ today: '2026-04-10', states });
      assert.strictEqual(due.length, 0);
    });

    it('excludes new (not started) articles', () => {
      const states = [
        { articleId: 'a', status: 'new', stage: 0, totalStages: 5 },
      ];
      const due = getDueArticles({ today: '2026-04-10', states });
      assert.strictEqual(due.length, 0);
    });
  });

  describe('sortDueArticles', () => {
    it('sorts by overdueDays desc first', () => {
      const list = [
        { articleId: 'a', overdueDays: 1, stage: 2, charCount: 30 },
        { articleId: 'b', overdueDays: 3, stage: 1, charCount: 50 },
      ];
      const sorted = sortDueArticles(list);
      assert.strictEqual(sorted[0].articleId, 'b');
    });

    it('breaks tie with stage desc (later stage higher priority)', () => {
      const list = [
        { articleId: 'a', overdueDays: 2, stage: 1, charCount: 30 },
        { articleId: 'b', overdueDays: 2, stage: 3, charCount: 50 },
      ];
      const sorted = sortDueArticles(list);
      assert.strictEqual(sorted[0].articleId, 'b');
    });

    it('breaks stage tie with charCount asc (shorter first)', () => {
      const list = [
        { articleId: 'a', overdueDays: 2, stage: 3, charCount: 100 },
        { articleId: 'b', overdueDays: 2, stage: 3, charCount: 20 },
      ];
      const sorted = sortDueArticles(list);
      assert.strictEqual(sorted[0].articleId, 'b');
    });

    it('handles same-day collision with multiple articles', () => {
      const list = [
        { articleId: 'a', overdueDays: 0, stage: 4, charCount: 50 },
        { articleId: 'b', overdueDays: 0, stage: 2, charCount: 20 },
        { articleId: 'c', overdueDays: 0, stage: 4, charCount: 30 },
      ];
      const sorted = sortDueArticles(list);
      // c: stage4, char30 > a: stage4, char50 > b: stage2, char20
      assert.strictEqual(sorted[0].articleId, 'c');
      assert.strictEqual(sorted[1].articleId, 'a');
      assert.strictEqual(sorted[2].articleId, 'b');
    });
  });
});
