/**
 * 翻译 API 路由
 * 使用免费词典 API 获取单词释义
 *
 * NOTE: This file intentionally only contains HTTP routing / response handling.
 * Heavy logic and large data tables live in services/ and data/.
 */

const express = require('express');
const router = express.Router();

const {
  translateWord,
  translateWordDetail,
} = require('../services/translateService');

// GET /api/translate/:word - 获取单词翻译
router.get('/:word', async (req, res) => {
  try {
    const result = await translateWord(req.params.word);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/translate/:word/detail - 获取单词详细信息（词性、音标、同/反义词、词形变化）
router.get('/:word/detail', async (req, res) => {
  try {
    const result = await translateWordDetail(req.params.word);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
