// server/routes/stats.js
const express = require('express')
const router = express.Router()
const statsService = require('../services/stats')

// 获取学习摘要
router.get('/summary', async (req, res) => {
  try {
    const data = await statsService.getSummary()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取每日记录
router.get('/daily', async (req, res) => {
  try {
    const data = await statsService.getDailyStats()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取学习日历
router.get('/calendar', async (req, res) => {
  try {
    const data = await statsService.getStudyCalendar()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取薄弱单词
router.get('/weak-words', async (req, res) => {
  try {
    const data = await statsService.getWeakWords()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 记录每日统计
router.post('/daily', async (req, res) => {
  try {
    const { date, wordsReviewed, accuracy } = req.body
    const result = await statsService.recordDailyStats(date, wordsReviewed, accuracy, 0)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 记录单词错误
router.post('/word-error', async (req, res) => {
  try {
    const { word } = req.body
    const result = await statsService.recordWordError(word)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
