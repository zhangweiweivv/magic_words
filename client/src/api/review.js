/**
 * 复习 API 封装
 */

import axios from 'axios';

const API_BASE = '/api/review';

/**
 * 获取今日待复习单词
 */
export async function getTodayReview() {
  const response = await axios.get(`${API_BASE}/today`);
  return response.data;
}

/**
 * 记录复习结果
 * @param {string} word - 单词
 * @param {boolean} remembered - 是否记住了
 */
export async function recordReview(word, remembered) {
  const response = await axios.post(`${API_BASE}/record`, {
    word,
    remembered
  });
  return response.data;
}

/**
 * 获取复习统计
 */
export async function getReviewStats() {
  const response = await axios.get(`${API_BASE}/stats`);
  return response.data;
}

/**
 * 标记今日测试完成
 * @param {number} points - 本次获得的总积分（可选）
 * @param {Array} rounds - 每轮测试数据（可选）
 * @param {number} stage - 复习阶段（可选）
 */
export async function completeQuiz(points, rounds = [], stage = 0) {
  const response = await axios.post(`${API_BASE}/complete-quiz`, { points, rounds, stage });
  return response.data;
}

export default {
  getTodayReview,
  recordReview,
  getReviewStats,
  completeQuiz
};
