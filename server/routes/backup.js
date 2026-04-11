const express = require('express');
const router = express.Router();
const backup = require('../services/backup');
const { success, error: errRes } = require('../utils/response');

// POST /api/backup/create - 创建今日快照
router.post('/create', (req, res) => {
  try {
    const result = backup.createDailyBackup();
    success(res, result);
  } catch (err) {
    errRes(res, err.message);
  }
});

// POST /api/backup/restore - 还原今日快照（撤销今日学习）
router.post('/restore', (req, res) => {
  try {
    const result = backup.restoreDailyBackup();
    success(res, result);
  } catch (err) {
    errRes(res, err.message);
  }
});

// GET /api/backup/status - 检查今日是否有备份
router.get('/status', (req, res) => {
  try {
    const has = backup.hasBackup();
    success(res, { hasBackup: has });
  } catch (err) {
    errRes(res, err.message);
  }
});

module.exports = router;
