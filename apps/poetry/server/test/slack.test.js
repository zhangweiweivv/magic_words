/**
 * Tests for Poetry Slack notification service.
 * Tests message formatting only — no real Slack API calls.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  formatStageComplete,
  formatArticleStarted,
  getChannelId,
} = require('../services/slack');

describe('Poetry Slack service', () => {
  describe('getChannelId', () => {
    it('returns default channel when env not set', () => {
      const original = process.env.POETRY_SLACK_CHANNEL_ID;
      delete process.env.POETRY_SLACK_CHANNEL_ID;
      const id = getChannelId();
      assert.equal(id, 'C0AL4DAQ02U');
      if (original) process.env.POETRY_SLACK_CHANNEL_ID = original;
    });

    it('returns env override when set', () => {
      const original = process.env.POETRY_SLACK_CHANNEL_ID;
      process.env.POETRY_SLACK_CHANNEL_ID = 'C_CUSTOM';
      const id = getChannelId();
      assert.equal(id, 'C_CUSTOM');
      if (original) {
        process.env.POETRY_SLACK_CHANNEL_ID = original;
      } else {
        delete process.env.POETRY_SLACK_CHANNEL_ID;
      }
    });
  });

  describe('formatArticleStarted', () => {
    it('formats new article message', () => {
      const state = {
        articleId: 'zi-01-jing-ye-si',
        collection: '子集',
        title: '静夜思',
        totalStages: 4,
        nextDueDate: '2026-04-12',
        startedAt: '2026-04-11',
      };
      const msg = formatArticleStarted(state);
      assert.ok(msg.includes('📝'));
      assert.ok(msg.includes('静夜思'));
      assert.ok(msg.includes('子集'));
      assert.ok(msg.includes('4'));
      assert.ok(msg.includes('2026-04-12'));
    });
  });

  describe('formatStageComplete', () => {
    it('formats stage advance (not graduated)', () => {
      const state = {
        articleId: 'zi-01',
        collection: '子集',
        title: '静夜思',
        stage: 2,
        totalStages: 4,
        nextDueDate: '2026-04-15',
        startedAt: '2026-04-11',
        lastCompletedAt: '2026-04-12',
      };
      const events = [
        { type: 'stage_completed', data: { fromStage: 1, toStage: 2 } },
      ];
      const msg = formatStageComplete(state, events);
      assert.ok(msg.includes('📜'));
      assert.ok(msg.includes('静夜思'));
      // 1-based: fromStage 1 → display 2, state.stage 2 → display 3
      assert.ok(msg.includes('2 → 3/4'));
      assert.ok(msg.includes('2026-04-15'));
      assert.ok(!msg.includes('毕业'));
    });

    it('formats graduation message', () => {
      const state = {
        articleId: 'zi-01',
        collection: '子集',
        title: '静夜思',
        stage: 4,
        totalStages: 4,
        nextDueDate: null,
        startedAt: '2026-04-01',
        lastCompletedAt: '2026-04-11',
        status: 'graduated',
      };
      const events = [
        { type: 'stage_completed', data: { fromStage: 3, toStage: 4 } },
        { type: 'graduated', data: { totalStages: 4 } },
      ];
      const msg = formatStageComplete(state, events);
      assert.ok(msg.includes('🎓'));
      assert.ok(msg.includes('毕业'));
      assert.ok(msg.includes('静夜思'));
      assert.ok(msg.includes('2026-04-01'));
      assert.ok(msg.includes('2026-04-11'));
    });
  });
});
