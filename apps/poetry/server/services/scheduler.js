/**
 * Scheduling engine: due list computation + collision-priority sorting.
 *
 * Next due date is always based on actual completion date (not original due date),
 * so overdue articles get their next interval from when they were actually completed.
 */

/**
 * Compute next due date from completion date and next stage interval.
 * @param {{ completedAt: string, nextStage: number, intervals: number[] }} params
 * @returns {string|null} ISO date string, or null if graduated
 */
function computeNextDueDate({ completedAt, nextStage, intervals }) {
  if (nextStage >= intervals.length) return null;
  const interval = intervals[nextStage];
  const date = new Date(completedAt);
  date.setDate(date.getDate() + interval);
  return date.toISOString().slice(0, 10);
}

/**
 * Get articles that are due (today or overdue). Excludes graduated and new.
 * @param {{ today: string, states: Array }} params
 * @returns {Array<{ ...state, overdueDays: number }>}
 */
function getDueArticles({ today, states }) {
  const todayMs = new Date(today).getTime();
  const result = [];

  for (const state of states) {
    if (state.status !== 'active') continue;
    if (!state.nextDueDate) continue;

    const dueMs = new Date(state.nextDueDate).getTime();
    if (dueMs > todayMs) continue;

    const overdueDays = Math.round((todayMs - dueMs) / (1000 * 60 * 60 * 24));
    result.push({ ...state, overdueDays });
  }

  return result;
}

/**
 * Sort due articles by priority:
 * 1) overdueDays desc (most overdue first)
 * 2) stage desc (later stage = higher priority)
 * 3) charCount asc (shorter = easier warm-up)
 * @param {Array} dueList
 * @returns {Array} sorted copy
 */
function sortDueArticles(dueList) {
  return [...dueList].sort((a, b) => {
    if (b.overdueDays !== a.overdueDays) return b.overdueDays - a.overdueDays;
    if (b.stage !== a.stage) return b.stage - a.stage;
    return (a.charCount || 0) - (b.charCount || 0);
  });
}

module.exports = { computeNextDueDate, getDueArticles, sortDueArticles };
