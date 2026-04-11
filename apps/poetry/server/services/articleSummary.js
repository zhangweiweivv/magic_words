/**
 * Shared article summary builder.
 * Provides a single source of truth for article summary fields
 * used by both admin and progress endpoints.
 */

const { withCurrentStage } = require('../routes/helpers');

/**
 * Build a consistent article summary from catalog article + optional state.
 * @param {{ article: object, state: object|null }} params
 * @returns {object} summary with standardized fields
 */
function buildArticleSummary({ article, state }) {
  const base = {
    articleId: article.articleId,
    number: article.number,
    title: article.title,
    section: article.section || null,
  };

  if (!state) {
    return {
      ...base,
      status: 'not_started',
      difficulty: null,
      scheduleSource: null,
      stage: null,
      currentStage: null,
      totalStages: null,
      intervals: null,
      nextDueDate: null,
    };
  }

  const enriched = {
    ...base,
    status: state.status || 'not_started',
    difficulty: state.difficulty || null,
    scheduleSource: state.scheduleSource || 'level_default',
    stage: state.stage,
    totalStages: state.totalStages || null,
    intervals: state.intervals || null,
    nextDueDate: state.nextDueDate || null,
  };

  // Add currentStage (human-readable stage + 1)
  if (state.stage != null) {
    enriched.currentStage = state.stage + 1;
  } else {
    enriched.currentStage = null;
  }

  return enriched;
}

module.exports = { buildArticleSummary };
