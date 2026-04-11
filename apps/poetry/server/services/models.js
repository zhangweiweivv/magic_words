/**
 * Data model validators for Poetry module.
 */

const VALID_STATUSES = ['new', 'active', 'graduated'];

/**
 * Validate an article learning state object.
 * @param {object} state
 * @throws {Error} on invalid shape
 */
function assertArticleState(state) {
  if (!state || typeof state !== 'object') {
    throw new Error('ArticleState must be an object');
  }
  if (typeof state.articleId !== 'string' || !state.articleId) {
    throw new Error('ArticleState.articleId must be a non-empty string');
  }
  if (typeof state.collection !== 'string' || !state.collection) {
    throw new Error('ArticleState.collection must be a non-empty string');
  }
  if (typeof state.title !== 'string' || !state.title) {
    throw new Error('ArticleState.title must be a non-empty string');
  }
  if (typeof state.stage !== 'number' || state.stage < 0) {
    throw new Error('ArticleState.stage must be a non-negative number');
  }
  if (typeof state.totalStages !== 'number' || state.totalStages < 1) {
    throw new Error('ArticleState.totalStages must be a positive number');
  }
  if (state.stage > state.totalStages) {
    throw new Error('ArticleState.stage cannot exceed totalStages');
  }
  if (!Array.isArray(state.intervals) || state.intervals.length === 0) {
    throw new Error('ArticleState.intervals must be a non-empty array');
  }
  if (!VALID_STATUSES.includes(state.status)) {
    throw new Error(`ArticleState.status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
}

/**
 * Validate an audit event object.
 * @param {object} event
 * @throws {Error} on invalid shape
 */
function assertEvent(event) {
  if (!event || typeof event !== 'object') {
    throw new Error('Event must be an object');
  }
  if (typeof event.type !== 'string' || !event.type) {
    throw new Error('Event.type must be a non-empty string');
  }
  if (typeof event.articleId !== 'string' || !event.articleId) {
    throw new Error('Event.articleId must be a non-empty string');
  }
  if (typeof event.timestamp !== 'string' || !event.timestamp) {
    throw new Error('Event.timestamp must be a non-empty string');
  }
  // data is optional
}

module.exports = { assertArticleState, assertEvent, VALID_STATUSES };
