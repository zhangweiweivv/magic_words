/**
 * Difficulty scoring and adaptive schedule recommendation for poetry articles.
 *
 * Difficulty is 1-4 based on text length and genre.
 * Schedule (totalStages + intervals) adapts to difficulty.
 */

/**
 * Score text length on 1-4 scale.
 * @param {number} charCount
 * @returns {number} 1-4
 */
function lengthScore(charCount) {
  if (charCount <= 20) return 1;
  if (charCount <= 50) return 2;
  if (charCount <= 100) return 3;
  return 4;
}

/**
 * Score genre on 1-4 scale.
 * @param {string} genre
 * @returns {number} 1-4
 */
function genreScore(genre) {
  const SCORES = {
    '五言绝句': 1,
    '七言绝句': 2,
    '五言律诗': 2,
    '七言律诗': 3,
    '词': 3,
    '文言文': 4,
  };
  return SCORES[genre] ?? 2;
}

/**
 * Compute overall difficulty (1-4) from article metadata.
 * @param {{ charCount: number, genre?: string }} meta
 * @returns {number} 1-4
 */
function computeDifficulty({ charCount, genre }) {
  const avg = (lengthScore(charCount) + genreScore(genre)) / 2;
  return Math.max(1, Math.min(4, Math.round(avg)));
}

/**
 * Recommend an Ebbinghaus-inspired schedule for given difficulty.
 * @param {number} difficulty 1-4
 * @returns {{ totalStages: number, intervals: number[] }}
 */
function recommendSchedule(difficulty) {
  const SCHEDULES = {
    1: { totalStages: 4, intervals: [1, 2, 4, 7] },
    2: { totalStages: 5, intervals: [1, 2, 4, 7, 14] },
    3: { totalStages: 6, intervals: [1, 2, 4, 7, 14, 30] },
    4: { totalStages: 7, intervals: [1, 2, 4, 7, 14, 30, 60] },
  };
  return SCHEDULES[difficulty] || SCHEDULES[2];
}

module.exports = { lengthScore, genreScore, computeDifficulty, recommendSchedule };
