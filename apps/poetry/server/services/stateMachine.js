/**
 * State transitions for article learning lifecycle.
 *
 * Every transition returns { nextState, events[] } where events are audit log entries.
 * Next due date is always computed from actual completion date (not original due).
 */

const { computeDifficulty, recommendSchedule } = require('./difficulty');
const { computeNextDueDate } = require('./scheduler');

/**
 * Extract YYYY-MM-DD from ISO timestamp or date string.
 */
function toDateStr(ts) {
  return typeof ts === 'string' ? ts.slice(0, 10) : new Date(ts).toISOString().slice(0, 10);
}

/**
 * Start learning a new article. Sets stage 0 as completed (first exposure done).
 * @param {null} _state - not used (new article)
 * @param {object} meta - { articleId, collection, title, charCount, genre }
 * @param {string} now - ISO timestamp
 * @returns {{ nextState: object, events: object[] }}
 */
function startArticle(_state, meta, now) {
  const difficulty = computeDifficulty({ charCount: meta.charCount, genre: meta.genre });
  const schedule = recommendSchedule(difficulty);
  const today = toDateStr(now);

  const nextDueDate = computeNextDueDate({
    completedAt: today,
    nextStage: 0,
    intervals: schedule.intervals,
  });

  const nextState = {
    articleId: meta.articleId,
    collection: meta.collection,
    title: meta.title,
    charCount: meta.charCount,
    genre: meta.genre || null,
    stage: 0,
    totalStages: schedule.totalStages,
    intervals: schedule.intervals,
    status: 'active',
    startedAt: today,
    lastCompletedAt: today,
    nextDueDate,
    difficulty,
  };

  const events = [
    {
      type: 'article_started',
      articleId: meta.articleId,
      timestamp: now,
      data: { difficulty, schedule },
    },
  ];

  return { nextState, events };
}

/**
 * Complete the current stage. Advances stage, may graduate.
 * @param {object} state
 * @param {string} now - ISO timestamp
 * @returns {{ nextState: object, events: object[] }}
 */
function completeStage(state, now) {
  const today = toDateStr(now);
  const newStage = state.stage + 1;
  const events = [];

  events.push({
    type: 'stage_completed',
    articleId: state.articleId,
    timestamp: now,
    data: { fromStage: state.stage, toStage: newStage },
  });

  const nextDueDate = computeNextDueDate({
    completedAt: today,
    nextStage: newStage,
    intervals: state.intervals,
  });

  const nextState = {
    ...state,
    stage: newStage,
    lastCompletedAt: today,
    nextDueDate,
  };

  // Check graduation
  if (newStage >= state.totalStages) {
    nextState.status = 'graduated';
    nextState.nextDueDate = null;
    events.push({
      type: 'graduated',
      articleId: state.articleId,
      timestamp: now,
      data: { totalStages: state.totalStages },
    });
  }

  return { nextState, events };
}

/**
 * Defer an article (skip today, reschedule to tomorrow).
 * Does not advance stage.
 * @param {object} state
 * @param {string} today - date string YYYY-MM-DD
 * @returns {{ nextState: object, events: object[] }}
 */
function deferArticle(state, today) {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextDueDate = tomorrow.toISOString().slice(0, 10);

  const nextState = {
    ...state,
    nextDueDate,
  };

  const events = [
    {
      type: 'deferred',
      articleId: state.articleId,
      timestamp: new Date(today).toISOString(),
      data: { originalDue: state.nextDueDate, newDue: nextDueDate },
    },
  ];

  return { nextState, events };
}

/**
 * Apply a config change (new intervals/totalStages). Recalculates future.
 * May auto-graduate if current stage >= new totalStages.
 * Never un-graduates.
 * @param {object} state
 * @param {{ intervals: number[], totalStages: number }} newConfig
 * @param {string} now - ISO timestamp
 * @returns {{ nextState: object, events: object[] }}
 */
function applyConfigChange(state, newConfig, now) {
  const events = [];

  events.push({
    type: 'config_changed',
    articleId: state.articleId,
    timestamp: now,
    data: {
      oldIntervals: state.intervals,
      newIntervals: newConfig.intervals,
      oldTotalStages: state.totalStages,
      newTotalStages: newConfig.totalStages,
    },
  });

  const nextState = {
    ...state,
    intervals: newConfig.intervals,
    totalStages: newConfig.totalStages,
  };

  // Already graduated → stays graduated
  if (state.status === 'graduated') {
    return { nextState, events };
  }

  // Check if config change causes auto-graduation
  if (state.stage >= newConfig.totalStages) {
    nextState.status = 'graduated';
    nextState.nextDueDate = null;
    events.push({
      type: 'graduated',
      articleId: state.articleId,
      timestamp: now,
      data: { reason: 'config_change_auto_graduate' },
    });
    return { nextState, events };
  }

  // Recalculate next due date
  const nextDueDate = computeNextDueDate({
    completedAt: state.lastCompletedAt,
    nextStage: state.stage,
    intervals: newConfig.intervals,
  });
  nextState.nextDueDate = nextDueDate;

  return { nextState, events };
}

module.exports = { startArticle, completeStage, deferArticle, applyConfigChange };
