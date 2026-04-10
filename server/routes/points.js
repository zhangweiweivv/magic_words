// server/routes/points.js
const express = require('express')
const router = express.Router()
const pointsService = require('../services/points')

// 获取积分数据
router.get('/', async (req, res) => {
  try {
    const data = await pointsService.getPointsData()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取积分规则
router.get('/rules', (req, res) => {
  res.json({ 
    success: true, 
    data: {
      rules: pointsService.POINT_RULES,
      levels: pointsService.LEVELS
    }
  })
})

// 添加积分
router.post('/add', async (req, res) => {
  try {
    const { action, points, note } = req.body
    const result = await pointsService.addPoints(action, points, note || '')
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 消费积分
router.post('/spend', async (req, res) => {
  try {
    const { amount, item } = req.body
    const result = await pointsService.spendPoints(amount, item)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
