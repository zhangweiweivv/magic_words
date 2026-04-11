const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { assertArticleState, assertEvent } = require('../services/models');

describe('models', () => {
  describe('assertArticleState', () => {
    const validState = {
      articleId: 'zi-01-jing-ye-si',
      collection: '子',
      title: '静夜思',
      stage: 1,
      totalStages: 5,
      intervals: [1, 2, 4, 7, 14],
      status: 'active',
      startedAt: '2026-04-01',
      lastCompletedAt: '2026-04-02',
      nextDueDate: '2026-04-04',
    };

    it('accepts a valid article state', () => {
      assert.doesNotThrow(() => assertArticleState(validState));
    });

    it('rejects missing articleId', () => {
      const bad = { ...validState };
      delete bad.articleId;
      assert.throws(() => assertArticleState(bad), /articleId/);
    });

    it('rejects non-string title', () => {
      assert.throws(() => assertArticleState({ ...validState, title: 123 }), /title/);
    });

    it('rejects negative stage', () => {
      assert.throws(() => assertArticleState({ ...validState, stage: -1 }), /stage/);
    });

    it('rejects stage > totalStages', () => {
      assert.throws(() => assertArticleState({ ...validState, stage: 10, totalStages: 5 }), /stage/);
    });

    it('rejects invalid status', () => {
      assert.throws(() => assertArticleState({ ...validState, status: 'paused' }), /status/);
    });

    it('accepts graduated status with stage = totalStages', () => {
      assert.doesNotThrow(() =>
        assertArticleState({ ...validState, status: 'graduated', stage: 5, totalStages: 5 })
      );
    });

    it('rejects missing intervals', () => {
      assert.throws(() => assertArticleState({ ...validState, intervals: undefined }), /intervals/);
    });

    it('rejects empty intervals array', () => {
      assert.throws(() => assertArticleState({ ...validState, intervals: [] }), /intervals/);
    });
  });

  describe('assertEvent', () => {
    const validEvent = {
      type: 'stage_completed',
      articleId: 'zi-01-jing-ye-si',
      timestamp: '2026-04-02T10:00:00.000Z',
      data: { fromStage: 0, toStage: 1 },
    };

    it('accepts a valid event', () => {
      assert.doesNotThrow(() => assertEvent(validEvent));
    });

    it('rejects missing type', () => {
      const bad = { ...validEvent };
      delete bad.type;
      assert.throws(() => assertEvent(bad), /type/);
    });

    it('rejects missing articleId', () => {
      assert.throws(() => assertEvent({ ...validEvent, articleId: undefined }), /articleId/);
    });

    it('rejects missing timestamp', () => {
      assert.throws(() => assertEvent({ ...validEvent, timestamp: undefined }), /timestamp/);
    });

    it('accepts event without data (optional)', () => {
      const { data, ...noData } = validEvent;
      assert.doesNotThrow(() => assertEvent(noData));
    });
  });
});
