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
  if (charCount <= 50) return 1;
  if (charCount <= 150) return 2;
  if (charCount <= 300) return 3;
  return 4;
}

/**
 * Score genre on 1-4 scale.
 * @param {string} genre
 * @returns {number} 1-4
 */
function genreScore(genre) {
  const SCORES = {
    // 诗词 = 1
    '五言绝句': 1,
    '七言绝句': 1,
    '五言律诗': 1,
    '七言律诗': 1,
    '词': 1,
    '诗': 1,
    '诗词': 1,
    // 古文（唐宋）= 2
    '古文_唐宋': 2,
    '唐宋古文': 2,
    // 古文（先秦）= 3
    '古文_先秦': 3,
    '先秦古文': 3,
    // 先秦诸子 = 4
    '先秦诸子': 4,
    // legacy mapping
    '文言文': 2,
  };
  return SCORES[genre] ?? 1;
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
    1: { totalStages: 3, intervals: [1, 2, 5] },
    2: { totalStages: 3, intervals: [1, 3, 7] },
    3: { totalStages: 4, intervals: [1, 3, 7, 14] },
    4: { totalStages: 5, intervals: [2, 4, 7, 14, 21] },
  };
  return SCHEDULES[difficulty] || SCHEDULES[2];
}

module.exports = { lengthScore, genreScore, computeDifficulty, recommendSchedule };
