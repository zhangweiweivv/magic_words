// server/routes/points.js
const express = require('express')
const router = express.Router()
const pointsService = require('../services/points')
const { success, error: errRes } = require('../utils/response')

// 获取积分数据
router.get('/', async (req, res) => {
  try {
    const data = await pointsService.getPointsData()
    success(res, data)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 获取积分规则
router.get('/rules', (req, res) => {
  success(res, {
    rules: pointsService.POINT_RULES,
    levels: pointsService.LEVELS
  })
})

// 添加积分
router.post('/add', async (req, res) => {
  try {
    const { action, points, note } = req.body
    if (!action || typeof action !== 'string') {
      return errRes(res, 'action must be a non-empty string', 400)
    }
    if (typeof points !== 'number' || points <= 0 || !Number.isFinite(points)) {
      return errRes(res, 'points must be a positive number', 400)
    }
    const result = await pointsService.addPoints(action, points, note || '')
    success(res, result)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 消费积分
router.post('/spend', async (req, res) => {
  try {
    const { amount, item } = req.body
    const result = await pointsService.spendPoints(amount, item)
    success(res, result)
  } catch (err) {
    errRes(res, err.message)
  }
})

module.exports = router
