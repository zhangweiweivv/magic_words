/**
 * 花园 API 路由
 */

const express = require('express');
const router = express.Router();
const gardenService = require('../services/garden');
const { success, error: errRes } = require('../utils/response');

// GET /api/garden/status — 获取花园状态
router.get('/status', (req, res) => {
  try {
    const status = gardenService.getGardenStatus();
    success(res, status);
  } catch (err) {
    errRes(res, '获取花园状态失败', 500, err.message);
  }
});

// POST /api/garden/water — 浇水
router.post('/water', (req, res) => {
  try {
    const result = gardenService.water();
    success(res, result);
  } catch (err) {
    errRes(res, '浇水失败', 500, err.message);
  }
});

// POST /api/garden/use-sunshine — 使用阳光
router.post('/use-sunshine', (req, res) => {
  try {
    const result = gardenService.useSunshine();
    success(res, result);
  } catch (err) {
    errRes(res, '使用阳光失败', 500, err.message);
  }
});

// POST /api/garden/use-fertilizer — 使用肥料
router.post('/use-fertilizer', (req, res) => {
  try {
    const result = gardenService.useFertilizer();
    success(res, result);
  } catch (err) {
    errRes(res, '使用肥料失败', 500, err.message);
  }
});

// POST /api/garden/add-resources — 添加资源
router.post('/add-resources', (req, res) => {
  try {
    const { type, amount } = req.body;
    const validTypes = ['water', 'sunshine', 'fertilizer'];
    if (!type || typeof type !== 'string' || !validTypes.includes(type)) {
      return errRes(res, `type must be one of: ${validTypes.join(', ')}`, 400);
    }
    if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
      return errRes(res, 'amount must be a positive number', 400);
    }
    const result = gardenService.addResources(type, amount);
    success(res, result);
  } catch (err) {
    errRes(res, '添加资源失败', 500, err.message);
  }
});

// GET /api/garden/fruits — 获取果实（已记住单词）
router.get('/fruits', (req, res) => {
  try {
    const fruits = gardenService.getFruits();
    success(res, { fruits, count: fruits.length });
  } catch (err) {
    errRes(res, '获取果实失败', 500, err.message);
  }
});

module.exports = router;
