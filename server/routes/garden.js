/**
 * 花园 API 路由
 */

const express = require('express');
const router = express.Router();
const gardenService = require('../services/garden');

// GET /api/garden/status — 获取花园状态
router.get('/status', (req, res) => {
  try {
    const status = gardenService.getGardenStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: '获取花园状态失败', detail: err.message });
  }
});

// POST /api/garden/water — 浇水
router.post('/water', (req, res) => {
  try {
    const result = gardenService.water();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: '浇水失败', detail: err.message });
  }
});

// POST /api/garden/use-sunshine — 使用阳光
router.post('/use-sunshine', (req, res) => {
  try {
    const result = gardenService.useSunshine();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: '使用阳光失败', detail: err.message });
  }
});

// POST /api/garden/use-fertilizer — 使用肥料
router.post('/use-fertilizer', (req, res) => {
  try {
    const result = gardenService.useFertilizer();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: '使用肥料失败', detail: err.message });
  }
});

// POST /api/garden/add-resources — 添加资源
router.post('/add-resources', (req, res) => {
  try {
    const { type, amount } = req.body;
    const result = gardenService.addResources(type, amount);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: '添加资源失败', detail: err.message });
  }
});

// GET /api/garden/fruits — 获取果实（已记住单词）
router.get('/fruits', (req, res) => {
  try {
    const fruits = gardenService.getFruits();
    res.json({ fruits, count: fruits.length });
  } catch (err) {
    res.status(500).json({ error: '获取果实失败', detail: err.message });
  }
});

module.exports = router;
