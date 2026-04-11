// server/routes/expansion.js
const express = require('express')
const router = express.Router()
const expansionService = require('../services/expansion')
const { success, error: errRes } = require('../utils/response')

// 获取扩展状态
router.get('/status', async (req, res) => {
  try {
    const data = await expansionService.getExpansionStatus()
    success(res, data)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 手动触发扩充
router.post('/expand', async (req, res) => {
  try {
    const { force } = req.body || {}
    const result = await expansionService.expandWords(!!force)
    success(res, result)
  } catch (err) {
    console.error('[expansion] Expand error:', err)
    errRes(res, err.message)
  }
})

module.exports = router
