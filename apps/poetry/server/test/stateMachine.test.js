const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  startArticle,
  completeStage,
  deferArticle,
  applyConfigChange,
} = require('../services/stateMachine');

describe('stateMachine', () => {
  const baseMeta = {
    articleId: 'zi-01',
    collection: '子',
    title: '静夜思',
    charCount: 20,
    genre: '五言绝句',
  };

  describe('startArticle', () => {
    it('creates initial state with stage 0 completed', () => {
      const now = '2026-04-10T10:00:00.000Z';
      const { nextState, events } = startArticle(null, baseMeta, now);

      assert.strictEqual(nextState.articleId, 'zi-01');
      assert.strictEqual(nextState.status, 'active');
      assert.strictEqual(nextState.stage, 0);
      assert.strictEqual(nextState.charCount, 20);
      assert.strictEqual(nextState.genre, '五言绝句');
      assert.ok(nextState.intervals.length > 0);
      assert.strictEqual(nextState.startedAt, '2026-04-10');
      assert.strictEqual(nextState.lastCompletedAt, '2026-04-10');
      assert.ok(nextState.nextDueDate); // should be set
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].type, 'article_started');
    });
  });

  describe('completeStage', () => {
    it('advances stage by 1', () => {
      const state = {
        articleId: 'zi-01',
        collection: '子',
        title: '静夜思',
        stage: 1,
        totalStages: 5,
        intervals: [1, 2, 4, 7, 14],
        status: 'active',
        startedAt: '2026-04-01',
        lastCompletedAt: '2026-04-03',
        nextDueDate: '2026-04-05',
      };
      const now = '2026-04-05T10:00:00.000Z';
      const { nextState, events } = completeStage(state, now);

      assert.strictEqual(nextState.stage, 2);
      assert.strictEqual(nextState.lastCompletedAt, '2026-04-05');
      assert.strictEqual(events[0].type, 'stage_completed');
      assert.strictEqual(events[0].data.fromStage, 1);
      assert.strictEqual(events[0].data.toStage, 2);
    });

    it('graduates when completing final stage', () => {
      const state = {
        articleId: 'zi-01',
        collection: '子',
        title: '静夜思',
        stage: 4,
        totalStages: 5,
        intervals: [1, 2, 4, 7, 14],
        status: 'active',
        startedAt: '2026-04-01',
        lastCompletedAt: '2026-04-20',
        nextDueDate: '2026-04-27',
      };
      const now = '2026-04-27T10:00:00.000Z';
      const { nextState, events } = completeStage(state, now);

      assert.strictEqual(nextState.stage, 5);
      assert.strictEqual(nextState.status, 'graduated');
      assert.strictEqual(nextState.nextDueDate, null);
      assert.strictEqual(events.length, 2); // stage_completed + graduated
      assert.strictEqual(events[1].type, 'graduated');
    });

    it('computes nextDueDate from actual completion date, not original due date', () => {
      const state = {
        articleId: 'zi-01',
        collection: '子',
        title: '静夜思',
        stage: 1,
        totalStages: 5,
        intervals: [1, 2, 4, 7, 14],
        status: 'active',
        startedAt: '2026-04-01',
        lastCompletedAt: '2026-04-03',
        nextDueDate: '2026-04-05', // due on the 5th
      };
      // But actually completed on the 8th (3 days late)
      const now = '2026-04-08T10:00:00.000Z';
      const { nextState } = completeStage(state, now);

      // Next interval is intervals[2] = 4 days from actual completion (Apr 8)
      assert.strictEqual(nextState.nextDueDate, '2026-04-12');
    });
  });

  describe('deferArticle', () => {
    it('marks overdue without advancing stage', () => {
      const state = {
        articleId: 'zi-01',
        collection: '子',
        title: '静夜思',
        stage: 2,
        totalStages: 5,
        intervals: [1, 2, 4, 7, 14],
        status: 'active',
        startedAt: '2026-04-01',
        lastCompletedAt: '2026-04-05',
        nextDueDate: '2026-04-09',
      };
      const today = '2026-04-09';
      const { nextState, events } = deferArticle(state, today);

      assert.strictEqual(nextState.stage, 2); // unchanged
      assert.strictEqual(nextState.nextDueDate, '2026-04-10'); // deferred to tomorrow
      assert.strictEqual(events[0].type, 'deferred');
    });
  });

  describe('applyConfigChange', () => {
    it('recalculates future with new intervals', () => {
      const state = {
        articleId: 'zi-01',
        collection: '子',
        title: '静夜思',
        stage: 2,
        totalStages: 5,
        intervals: [1, 2, 4, 7, 14],
        status: 'active',
        startedAt: '2026-04-01',
        lastCompletedAt: '2026-04-05',
        nextDueDate: '2026-04-09',
      };
      const newConfig = { intervals: [1, 2, 3, 5, 10], totalStages: 5 };
      const now = '2026-04-07T10:00:00.000Z';
      const { nextState, events } = applyConfigChange(state, newConfig, now);

      // Stage 2 with new intervals[2]=3, from lastCompletedAt Apr 5 → Apr 8
      assert.strictEqual(nextState.nextDueDate, '2026-04-08');
      assert.deepStrictEqual(nextState.intervals, [1, 2, 3, 5, 10]);
      assert.strictEqual(events[0].type, 'config_changed');
    });

    it('auto-graduates when stage reduction puts stage >= totalStages', () => {
      const state = {
        articleId: 'zi-01',
        collection: '子',
        title: '静夜思',
        stage: 4,
        totalStages: 5,
        intervals: [1, 2, 4, 7, 14],
        status: 'active',
        startedAt: '2026-04-01',
        lastCompletedAt: '2026-04-20',
        nextDueDate: '2026-04-27',
      };
      const newConfig = { intervals: [1, 2, 4], totalStages: 3 };
      const now = '2026-04-21T10:00:00.000Z';
      const { nextState, events } = applyConfigChange(state, newConfig, now);

      assert.strictEqual(nextState.status, 'graduated');
      assert.strictEqual(nextState.nextDueDate, null);
      assert.ok(events.some(e => e.type === 'graduated'));
    });

    it('does not ungraduate an already graduated article', () => {
      const state = {
        articleId: 'zi-01',
        collection: '子',
        title: '静夜思',
        stage: 5,
        totalStages: 5,
        intervals: [1, 2, 4, 7, 14],
        status: 'graduated',
        startedAt: '2026-04-01',
        lastCompletedAt: '2026-04-20',
        nextDueDate: null,
      };
      const newConfig = { intervals: [1, 2, 4, 7, 14, 30, 60], totalStages: 7 };
      const now = '2026-04-21T10:00:00.000Z';
      const { nextState, events } = applyConfigChange(state, newConfig, now);

      assert.strictEqual(nextState.status, 'graduated');
      assert.strictEqual(events[0].type, 'config_changed');
      assert.ok(!events.some(e => e.type === 'ungraduated'));
    });
  });
});
