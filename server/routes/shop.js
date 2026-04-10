// server/routes/shop.js
const express = require('express')
const router = express.Router()
const shopService = require('../services/shop')

// 延迟加载 pointsService，避免循环依赖
let pointsService = null
function getPointsService() {
  if (!pointsService) {
    pointsService = require('../services/points')
  }
  return pointsService
}

// 获取商店数据
router.get('/', async (req, res) => {
  try {
    const data = await shopService.getShopData()
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 购买虚拟商品
router.post('/purchase', async (req, res) => {
  try {
    const { category, itemId } = req.body
    const result = await shopService.purchaseItem(category, itemId, getPointsService())
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 装备商品
router.post('/equip', async (req, res) => {
  try {
    const { category, itemId } = req.body
    const result = await shopService.equipItem(category, itemId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 验证家长密码
router.post('/verify-parent', async (req, res) => {
  try {
    const { password } = req.body
    const valid = shopService.verifyParentPassword(password)
    res.json({ success: true, valid })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 添加现实奖励（家长操作）
router.post('/rewards/add', async (req, res) => {
  try {
    const { name, price, password } = req.body
    const valid = shopService.verifyParentPassword(password)
    if (!valid) return res.json({ success: false, error: '密码错误' })
    
    const result = await shopService.addRealReward(name, price)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 兑换现实奖励
router.post('/rewards/redeem', async (req, res) => {
  try {
    const { rewardName, password } = req.body
    const valid = shopService.verifyParentPassword(password)
    if (!valid) return res.json({ success: false, error: '密码错误' })
    
    const result = await shopService.redeemRealReward(rewardName, getPointsService())
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
