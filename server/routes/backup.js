const express = require('express');
const router = express.Router();
const backup = require('../services/backup');

// POST /api/backup/create - 创建今日快照
router.post('/create', (req, res) => {
  try {
    const result = backup.createDailyBackup();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/backup/restore - 还原今日快照（撤销今日学习）
router.post('/restore', (req, res) => {
  try {
    const result = backup.restoreDailyBackup();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/backup/status - 检查今日是否有备份
router.get('/status', (req, res) => {
  try {
    const has = backup.hasBackup();
    res.json({ success: true, data: { hasBackup: has } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
