// server/routes/achievements.js
const express = require('express')
const router = express.Router()
const achievementsService = require('../services/achievements')
const { success, error: errRes } = require('../utils/response')

// 获取所有成就
router.get('/', async (req, res) => {
  try {
    const data = await achievementsService.getAchievements()
    success(res, data)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 批量解锁成就
router.post('/unlock-batch', async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return success(res, { unlocked: [] })
    }
    const result = await achievementsService.unlockBatch(ids)
    success(res, result)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 解锁成就
router.post('/unlock', async (req, res) => {
  try {
    const { achievementId } = req.body
    const result = await achievementsService.unlockAchievement(achievementId)
    success(res, result)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 更新进度
router.post('/progress', async (req, res) => {
  try {
    const { field, value } = req.body
    const result = await achievementsService.updateProgress(field, value)
    success(res, result)
  } catch (err) {
    errRes(res, err.message)
  }
})

module.exports = router
