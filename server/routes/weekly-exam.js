/**
 * 周考 API 路由 - Weekly Exam Routes
 */

const express = require('express');
const router = express.Router();
const weeklyExamService = require('../services/weeklyExam');

// GET /api/weekly-exam/current - 获取当前周考
router.get('/current', (req, res) => {
  try {
    const exam = weeklyExamService.getOrGenerateExam();
    res.json({ success: true, data: exam });
  } catch (e) {
    console.error('[weekly-exam] getOrGenerateExam error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/weekly-exam/first-round - 记录第一轮成绩
router.post('/first-round', (req, res) => {
  try {
    const { generatedDate, total, correct, wrongDetails } = req.body;

    if (!generatedDate) {
      return res.status(400).json({ success: false, error: 'generatedDate is required' });
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(generatedDate)) {
      return res.status(400).json({
        success: false,
        error: 'generatedDate must be YYYY-MM-DD format',
      });
    }
    if (typeof total !== 'number' || typeof correct !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'total and correct must be numbers',
      });
    }
    if (total < 0 || correct < 0 || correct > total) {
      return res.status(400).json({
        success: false,
        error: 'invalid total/correct values',
      });
    }

    // Validate generatedDate matches current exam
    const status = weeklyExamService.readStatus();
    if (!status) {
      return res.status(400).json({ success: false, error: 'No active exam' });
    }
    if (status.generatedDate !== generatedDate) {
      return res.status(400).json({
        success: false,
        error: `generatedDate mismatch: expected ${status.generatedDate}, got ${generatedDate}`,
      });
    }

    // wrongDetails: array of { word, meaning } → maps to wrongWords param
    const wrongWords = Array.isArray(wrongDetails) ? wrongDetails : [];
    const result = weeklyExamService.recordFirstRound(correct, total, wrongWords);
    res.json({ success: true, data: result });
  } catch (e) {
    console.error('[weekly-exam] recordFirstRound error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/weekly-exam/complete - 标记周考完成
router.post('/complete', (req, res) => {
  try {
    const { generatedDate, rounds } = req.body;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (generatedDate && !dateRegex.test(generatedDate)) {
      return res.status(400).json({
        success: false,
        error: 'generatedDate must be YYYY-MM-DD format',
      });
    }

    // Validate generatedDate matches current exam
    const status = weeklyExamService.readStatus();
    if (!status) {
      return res.status(400).json({ success: false, error: 'No active exam' });
    }
    if (status.generatedDate !== generatedDate) {
      return res.status(400).json({
        success: false,
        error: `generatedDate mismatch: expected ${status.generatedDate}, got ${generatedDate}`,
      });
    }

    const result = weeklyExamService.markComplete(rounds);
    res.json({ success: true, data: result });
  } catch (e) {
    console.error('[weekly-exam] markComplete error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
