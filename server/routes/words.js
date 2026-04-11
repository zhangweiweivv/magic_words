/**
 * 单词 API 路由
 */

const express = require('express');
const router = express.Router();
const obsidian = require('../services/obsidian');
const { parseReviewFile } = require('../services/review');
const { success, error: errRes } = require('../utils/response');

const STAGE_NAMES = ['Day 0 首学', 'Day 1 复习1', 'Day 3 毕业考'];

/**
 * 给单词列表附加复习进度信息
 */
function attachReviewProgress(words) {
  const progress = parseReviewFile();
  return words.map(w => {
    const data = progress.get(w.word);
    if (!data) {
      // 没有复习记录
      if (w.status === 'learned') {
        // 已记住单词本的词 = 已毕业
        return { ...w, reviewStage: '已毕业', reviewCount: 3, nextReviewDate: null };
      }
      return { ...w, reviewStage: '新词', reviewCount: 0, nextReviewDate: null };
    }
    const count = data.reviewCount;
    let stage;
    if (count >= 3) {
      stage = '已毕业';
    } else {
      stage = STAGE_NAMES[count] || `Stage ${count}`;
    }
    return {
      ...w,
      reviewStage: stage,
      reviewCount: count,
      nextReviewDate: data.nextReviewDate || null
    };
  });
}

// GET /api/words - 获取所有单词
router.get('/', (req, res) => {
  try {
    const words = obsidian.getAllWords();
    success(res, attachReviewProgress(words));
  } catch (err) {
    errRes(res, err.message);
  }
});

// GET /api/words/unlearned - 获取未记住的单词
router.get('/unlearned', (req, res) => {
  try {
    const words = obsidian.getUnlearnedWords();
    const enriched = attachReviewProgress(words);
    success(res, enriched);
  } catch (err) {
    errRes(res, err.message);
  }
});

// GET /api/words/learned - 获取已记住的单词
router.get('/learned', (req, res) => {
  try {
    const words = obsidian.getLearnedWords();
    const enriched = attachReviewProgress(words);
    success(res, enriched);
  } catch (err) {
    errRes(res, err.message);
  }
});

// GET /api/words/stats - 获取统计数据
router.get('/stats', (req, res) => {
  try {
    const stats = obsidian.getStats();
    success(res, stats);
  } catch (err) {
    errRes(res, err.message);
  }
});

// POST /api/words/move-to-learned - 将单词移到已记住
router.post('/move-to-learned', (req, res) => {
  try {
    const { words } = req.body;
    if (!words || !Array.isArray(words)) {
      return errRes(res, '请提供单词列表', 400);
    }
    
    const result = obsidian.moveToLearned(words);
    success(res, result);
  } catch (err) {
    errRes(res, err.message);
  }
});

module.exports = router;
