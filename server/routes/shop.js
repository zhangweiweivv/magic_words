// server/routes/shop.js
const express = require('express')
const router = express.Router()
const shopService = require('../services/shop')
const { success, error: errRes } = require('../utils/response')

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
    success(res, data)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 购买虚拟商品
router.post('/purchase', async (req, res) => {
  try {
    const { category, itemId } = req.body
    if (!category || typeof category !== 'string') {
      return errRes(res, 'category must be a non-empty string', 400)
    }
    if (!itemId || typeof itemId !== 'string') {
      return errRes(res, 'itemId must be a non-empty string', 400)
    }
    const result = await shopService.purchaseItem(category, itemId, getPointsService())
    success(res, result)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 装备商品
router.post('/equip', async (req, res) => {
  try {
    const { category, itemId } = req.body
    const result = await shopService.equipItem(category, itemId)
    success(res, result)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 验证家长密码
router.post('/verify-parent', async (req, res) => {
  try {
    const { password } = req.body
    const valid = shopService.verifyParentPassword(password)
    success(res, { valid })
  } catch (err) {
    errRes(res, err.message)
  }
})

// 添加现实奖励（家长操作）
router.post('/rewards/add', async (req, res) => {
  try {
    const { name, price, password } = req.body
    const valid = shopService.verifyParentPassword(password)
    if (!valid) return errRes(res, '密码错误', 403)
    
    const result = await shopService.addRealReward(name, price)
    success(res, result)
  } catch (err) {
    errRes(res, err.message)
  }
})

// 兑换现实奖励
router.post('/rewards/redeem', async (req, res) => {
  try {
    const { rewardName, password } = req.body
    const valid = shopService.verifyParentPassword(password)
    if (!valid) return errRes(res, '密码错误', 403)
    
    const result = await shopService.redeemRealReward(rewardName, getPointsService())
    success(res, result)
  } catch (err) {
    errRes(res, err.message)
  }
})

module.exports = router
