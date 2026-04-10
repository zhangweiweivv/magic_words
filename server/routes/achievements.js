// server/routes/achievements.js
const express = require('express')
const router = express.Router()
const achievementsService = require('../services/achievements')

// 获取所有成就
router.get('/', async (req, res) => {
  try {
    const data = await achievementsService.getAchievements()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 解锁成就
router.post('/unlock', async (req, res) => {
  try {
    const { achievementId } = req.body
    const result = await achievementsService.unlockAchievement(achievementId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 更新进度
router.post('/progress', async (req, res) => {
  try {
    const { field, value } = req.body
    const result = await achievementsService.updateProgress(field, value)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
