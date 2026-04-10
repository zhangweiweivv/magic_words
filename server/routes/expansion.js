// server/routes/expansion.js
const express = require('express')
const router = express.Router()
const expansionService = require('../services/expansion')

// 获取扩展状态
router.get('/status', async (req, res) => {
  try {
    const data = await expansionService.getExpansionStatus()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 手动触发扩充
router.post('/expand', async (req, res) => {
  try {
    const { force } = req.body || {}
    const result = await expansionService.expandWords(!!force)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[expansion] Expand error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
