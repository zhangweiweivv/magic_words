// server/routes/stats.js
const express = require('express')
const router = express.Router()
const statsService = require('../services/stats')
const { success, error: errRes } = require('../utils/response')

// 获取学习摘要
router.get('/summary', async (req, res) => {
  try {
    const data = await statsService.getSummary()
    success(res, data)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 获取每日记录
router.get('/daily', async (req, res) => {
  try {
    const data = await statsService.getDailyStats()
    success(res, data)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 获取学习日历
router.get('/calendar', async (req, res) => {
  try {
    const data = await statsService.getStudyCalendar()
    success(res, data)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 获取薄弱单词
router.get('/weak-words', async (req, res) => {
  try {
    const data = await statsService.getWeakWords()
    success(res, data)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 记录每日统计
router.post('/daily', async (req, res) => {
  try {
    const { date, wordsReviewed, accuracy } = req.body
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errRes(res, 'date must be a valid ISO date string (YYYY-MM-DD)', 400)
    }
    const result = await statsService.recordDailyStats(date, wordsReviewed, accuracy, 0)
    success(res, result)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 记录单词错误
router.post('/word-error', async (req, res) => {
  try {
    const { word } = req.body
    const result = await statsService.recordWordError(word)
    success(res, result)
  } catch (err) {
    errRes(res, err.message)
  }
})

module.exports = router
