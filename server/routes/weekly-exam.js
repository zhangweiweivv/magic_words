/**
 * 周考 API 路由 - Weekly Exam Routes
 */

const express = require('express');
const router = express.Router();
const weeklyExamService = require('../services/weeklyExam');
const { success, error: errRes } = require('../utils/response');

// GET /api/weekly-exam/current - 获取当前周考
router.get('/current', (req, res) => {
  try {
    const exam = weeklyExamService.getOrGenerateExam();
    success(res, exam);
  } catch (e) {
    console.error('[weekly-exam] getOrGenerateExam error:', e);
    errRes(res, e.message);
  }
});

// POST /api/weekly-exam/first-round - 记录第一轮成绩
router.post('/first-round', (req, res) => {
  try {
    const { generatedDate, total, correct, wrongDetails } = req.body;

    if (!generatedDate) {
      return errRes(res, 'generatedDate is required', 400);
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(generatedDate)) {
      return errRes(res, 'generatedDate must be YYYY-MM-DD format', 400);
    }
    if (typeof total !== 'number' || typeof correct !== 'number') {
      return errRes(res, 'total and correct must be numbers', 400);
    }
    if (total < 0 || correct < 0 || correct > total) {
      return errRes(res, 'invalid total/correct values', 400);
    }

    // Validate generatedDate matches current exam
    const status = weeklyExamService.readStatus();
    if (!status) {
      return errRes(res, 'No active exam', 400);
    }
    if (status.generatedDate !== generatedDate) {
      return errRes(res, `generatedDate mismatch: expected ${status.generatedDate}, got ${generatedDate}`, 400);
    }

    // wrongDetails: array of { word, meaning } → maps to wrongWords param
    const wrongWords = Array.isArray(wrongDetails) ? wrongDetails : [];
    const result = weeklyExamService.recordFirstRound(correct, total, wrongWords);
    success(res, result);
  } catch (e) {
    console.error('[weekly-exam] recordFirstRound error:', e);
    errRes(res, e.message);
  }
});

// POST /api/weekly-exam/complete - 标记周考完成
router.post('/complete', (req, res) => {
  try {
    const { generatedDate, rounds } = req.body;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (generatedDate && !dateRegex.test(generatedDate)) {
      return errRes(res, 'generatedDate must be YYYY-MM-DD format', 400);
    }

    // Validate generatedDate matches current exam
    const status = weeklyExamService.readStatus();
    if (!status) {
      return errRes(res, 'No active exam', 400);
    }
    if (status.generatedDate !== generatedDate) {
      return errRes(res, `generatedDate mismatch: expected ${status.generatedDate}, got ${generatedDate}`, 400);
    }

    const result = weeklyExamService.markComplete(rounds);
    success(res, result);
  } catch (e) {
    console.error('[weekly-exam] markComplete error:', e);
    errRes(res, e.message);
  }
});

module.exports = router;
