const fs = require('fs');
const path = require('path');

const OBSIDIAN_PATH = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本';
const BACKUP_DIR = path.join(OBSIDIAN_PATH, '.daily-backup');

// 需要备份的文件
const BACKUP_FILES = [
  '复习记录.md',
  '积分记录.md',
  '.quiz-status.json',
  '学习统计.md',
  '成就记录.md',
  '未记住单词.md',
  '已记住单词.md',
  '花园状态.json',
  '商店配置.md',
  'expansion-state.json'
];

function getTodayStr() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

// 创建今日快照（如果今天还没备份过）
function createDailyBackup() {
  const today = getTodayStr();
  const backupPath = path.join(BACKUP_DIR, today);
  
  // 如果今天已经备份过，跳过
  if (fs.existsSync(backupPath)) {
    return { created: false, message: '今日已有备份', date: today };
  }
  
  // 创建备份目录
  fs.mkdirSync(backupPath, { recursive: true });
  
  let backedUp = [];
  for (const file of BACKUP_FILES) {
    const src = path.join(OBSIDIAN_PATH, file);
    const dest = path.join(backupPath, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      backedUp.push(file);
    }
  }
  
  // 清理旧备份（只保留最近7天）
  cleanOldBackups(7);
  
  return { created: true, message: '备份创建成功', date: today, files: backedUp };
}

// 还原今日备份（撤销今天的学习）
function restoreDailyBackup() {
  const today = getTodayStr();
  const backupPath = path.join(BACKUP_DIR, today);
  
  if (!fs.existsSync(backupPath)) {
    return { restored: false, message: '没有今日备份可还原' };
  }
  
  let restored = [];
  for (const file of BACKUP_FILES) {
    const src = path.join(backupPath, file);
    const dest = path.join(OBSIDIAN_PATH, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      restored.push(file);
    } else {
      // 备份中没有这个文件，说明原来就没有，删掉现在的
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
        restored.push(file + ' (deleted)');
      }
    }
  }
  
  // 删除今日备份目录（防止重复还原）
  fs.rmSync(backupPath, { recursive: true });
  
  return { restored: true, message: '已撤销今日学习数据', files: restored };
}

// 检查今日是否有备份
function hasBackup() {
  const today = getTodayStr();
  const backupPath = path.join(BACKUP_DIR, today);
  return fs.existsSync(backupPath);
}

// 清理旧备份
function cleanOldBackups(keepDays) {
  if (!fs.existsSync(BACKUP_DIR)) return;
  
  const dirs = fs.readdirSync(BACKUP_DIR);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - keepDays);
  
  for (const dir of dirs) {
    const dirDate = new Date(dir);
    if (!isNaN(dirDate.getTime()) && dirDate < cutoff) {
      fs.rmSync(path.join(BACKUP_DIR, dir), { recursive: true });
    }
  }
}

module.exports = { createDailyBackup, restoreDailyBackup, hasBackup };
