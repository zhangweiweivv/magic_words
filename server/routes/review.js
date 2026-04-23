/**
 * 复习 API 路由
 */

const express = require('express');
const router = express.Router();
const review = require('../services/review');
const obsidian = require('../services/obsidian');
const slack = require('../services/slack');
const backup = require('../services/backup');
const expansion = require('../services/expansion');
const { applyExampleVersion } = require('../services/examples');
const { success, error: errRes } = require('../utils/response');

// GET /api/review/today - 获取今日待复习单词
router.get('/today', async (req, res) => {
  try {
    backup.createDailyBackup(); // 每天第一次请求时自动备份

    // 自动检查是否需要扩充新词（静默执行，不影响复习流程）
    try {
      const expandResult = await expansion.expandWords(false);
      if (expandResult.expanded) {
        console.log(`[review/today] 自动扩充了 ${expandResult.wordsAdded} 个新词`);
      }
    } catch (expandErr) {
      console.error('[review/today] 自动扩充检查失败:', expandErr.message);
    }
    
    // 检查今日任务是否已完成
    const quizCompleted = review.getTodayQuizStatus();
    if (quizCompleted) {
      // 今日任务已完成，不再加载新词
      return success(res, {
        count: 0,
        words: [],
        todayCompleted: true
      });
    }
    
    const unlearnedWords = obsidian.getUnlearnedWords();
    const reviewWords = review.getTodayReviewWords(unlearnedWords);
    
    success(res, {
      count: reviewWords.length,
      words: applyExampleVersion(reviewWords)
    });
  } catch (err) {
    errRes(res, err.message);
  }
});

// POST /api/review/record - 记录复习结果
router.post('/record', (req, res) => {
  try {
    const { word, remembered } = req.body;
    
    if (!word || typeof remembered !== 'boolean') {
      return errRes(res, '缺少必要参数: word, remembered', 400);
    }
    
    const result = review.recordReview(word, remembered);
    
    success(res, result);
  } catch (err) {
    errRes(res, err.message);
  }
});

// GET /api/review/stats - 获取复习统计
router.get('/stats', (req, res) => {
  try {
    const unlearnedWords = obsidian.getUnlearnedWords();
    const stats = review.getReviewStats(unlearnedWords);
    // Override todayRemaining with actual batch size from getTodayReviewWords
    const todayWords = review.getTodayReviewWords(unlearnedWords);
    stats.todayRemaining = stats.quizCompleted ? 0 : todayWords.length;
    
    success(res, stats);
  } catch (err) {
    errRes(res, err.message);
  }
});

// POST /api/review/complete-quiz - 标记今日测试完成
router.post('/complete-quiz', async (req, res) => {
  try {
    const quizSuccess = review.markTodayQuizComplete();
    
    if (quizSuccess) {
      const { points = 0, rounds = [], stage } = req.body || {};
      
      // 发送 Slack 通知
      slack.sendDailyComplete({ points, rounds, stage }).catch(err => {
        console.error('[complete-quiz] Slack 通知失败:', err.message);
      });
      
      // 记录学习统计
      const statsService = require('../services/stats');
      const { getTodayDateCST } = require('../utils/date');
      const today = getTodayDateCST();
      
      // 从 rounds 计算统计数据
      // rounds 结构: [{ totalQuestions, correctCount, wrongCount, ... }, ...]
      const totalQuestions = rounds.reduce((sum, r) => sum + (r.totalQuestions || 0), 0);
      const totalCorrect = rounds.reduce((sum, r) => sum + (r.correctCount || 0), 0);
      // 复习单词数 = 第一轮的题目数（去重后的实际单词数）
      const wordsCount = rounds.length > 0 ? (rounds[0].totalQuestions || 0) : 0;
      const accuracy = totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100) + '%'
        : '0%';
      
      statsService.recordDailyStats(today, wordsCount, accuracy, points).catch(err => {
        console.error('[complete-quiz] 记录统计失败:', err.message);
      });
    }
    
    success(res, { completed: quizSuccess });
  } catch (err) {
    errRes(res, err.message);
  }
});

module.exports = router;
