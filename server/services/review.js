/**
 * 复习记录服务
 * 管理艾宾浩斯复习进度
 */

const fs = require('fs');
const path = require('path');
const { getTodayDateCST, getNowTimeCST, getDateAfterDaysCST } = require('../utils/date');

const OBSIDIAN_PATH = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本';
const REVIEW_FILE = path.join(OBSIDIAN_PATH, '复习记录.md');

// 艾宾浩斯间隔：0天、1天、3天（3次复习）
const EBBINGHAUS_LOG = path.join(OBSIDIAN_PATH, 'ebbinghaus-log.md');

const CONFIG_FILE = path.join(__dirname, '..', 'config', 'quiz-config.json');

/**
 * 从配置文件读取 intervals、stageNames、dailyLimit
 * 每次调用都重新读文件，这样配置改了立刻生效
 */
function getConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const cfg = JSON.parse(raw);
    return {
      intervals: cfg.intervals || [0, 1, 3],
      stageNames: cfg.stageNames || ['Day 0 首学', 'Day 1 复习1', 'Day 3 毕业考'],
      dailyLimit: cfg.dailyLimit || 15
    };
  } catch (e) {
    console.error('读取配置文件失败，使用默认值:', e.message);
    return {
      intervals: [0, 1, 3],
      stageNames: ['Day 0 首学', 'Day 1 复习1', 'Day 3 毕业考'],
      dailyLimit: 15
    };
  }
}

// 保留常量用于向后兼容（不再使用，改用 getConfig()）
const INTERVALS = [0, 1, 3];
const STAGE_NAMES = ['Day 0 首学', 'Day 1 复习1', 'Day 3 毕业考'];

/**
 * 写入艾宾浩斯日志
 */
function logEbbinghaus(action, details) {
  const time = getNowTimeCST();
  const today = getTodayDateCST();
  
  let content = '';
  if (!fs.existsSync(EBBINGHAUS_LOG)) {
    content = '# 艾宾浩斯状态迁移日志\n\n';
  } else {
    content = fs.readFileSync(EBBINGHAUS_LOG, 'utf-8');
  }
  
  // 检查今天的日期头是否已存在
  const dateHeader = `## ${today}`;
  if (!content.includes(dateHeader)) {
    content += `\n${dateHeader}\n\n`;
  }
  
  // 在文件末尾添加日志
  content += `- \`${time}\` **${action}** ${details}\n`;
  
  fs.writeFileSync(EBBINGHAUS_LOG, content, 'utf-8');
}

// 每日复习上限（默认值，实际从配置文件读取）
const DAILY_LIMIT = 15;

// 模块级变量，缓存今天已记录的日志（防止同一天同一批次重复写日志）
let _lastLogDate = null;
let _lastLogBatchKey = null;

/**
 * 解析复习记录文件，返回单词进度 Map
 */
function parseReviewFile() {
  const progress = new Map();
  
  if (!fs.existsSync(REVIEW_FILE)) {
    return progress;
  }
  
  try {
    const content = fs.readFileSync(REVIEW_FILE, 'utf-8');
    const lines = content.split('\n');
    let inProgressTable = false;
    
    for (const line of lines) {
      if (line.includes('| 单词 | 复习次数 |')) {
        inProgressTable = true;
        continue;
      }
      if (line.includes('|---')) continue;
      if (inProgressTable && !line.startsWith('|')) {
        inProgressTable = false;
        continue;
      }
      if (inProgressTable) {
        const match = line.match(/^\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|/);
        if (match) {
          const word = match[1].trim();
          const reviewCount = parseInt(match[2], 10);
          const lastReviewDate = match[3].trim() || null;
          const nextReviewDate = match[4].trim() || null;
          progress.set(word, { reviewCount, lastReviewDate, nextReviewDate });
        }
      }
    }
  } catch (error) {
    console.error('解析复习记录失败:', error.message);
  }
  
  return progress;
}

/**
 * 保存复习记录到文件
 */
function saveReviewFile(progress, logs = []) {
  const sortedEntries = Array.from(progress.entries())
    .sort((a, b) => {
      if (a[1].reviewCount !== b[1].reviewCount) {
        return a[1].reviewCount - b[1].reviewCount;
      }
      return a[0].localeCompare(b[0]);
    });
  
  let content = `# 复习记录

> 此文件由可可单词网站自动维护，请勿手动编辑

## 单词进度

| 单词 | 复习次数 | 上次复习 | 下次复习 |
|------|---------|---------|---------|
`;

  for (const [word, data] of sortedEntries) {
    const last = data.lastReviewDate || '-';
    const next = data.nextReviewDate || '-';
    content += `| ${word} | ${data.reviewCount} | ${last} | ${next} |\n`;
  }

  let existingLogs = '';
  if (fs.existsSync(REVIEW_FILE)) {
    const existing = fs.readFileSync(REVIEW_FILE, 'utf-8');
    const logSection = existing.split('## 复习日志')[1];
    if (logSection) {
      existingLogs = logSection;
    }
  }

  if (logs.length > 0) {
    const today = getTodayDateCST();
    const todayHeader = `\n### ${today}\n`;
    
    if (!existingLogs.includes(todayHeader)) {
      existingLogs = todayHeader + existingLogs;
    }
    
    const logEntries = logs.map(log => {
      const status = log.remembered ? '✓' : '✗';
      const countText = log.remembered ? `(第${log.count}次)` : '(重复)';
      return `- ${log.time} ${log.word} ${status} ${countText}`;
    }).join('\n');
    
    const parts = existingLogs.split(todayHeader);
    if (parts.length > 1) {
      existingLogs = todayHeader + logEntries + '\n' + parts[1];
    } else {
      existingLogs = todayHeader + logEntries + '\n' + existingLogs;
    }
  }

  content += '\n## 复习日志\n' + existingLogs;

  const tempFile = REVIEW_FILE + '.tmp';
  fs.writeFileSync(tempFile, content, 'utf-8');
  fs.renameSync(tempFile, REVIEW_FILE);
}

/**
 * 获取今日待复习的单词
 * 新逻辑：一天只做一批，不混合不同阶段的单词
 * 优先级：毕业考(Day3) > 复习1(Day1) > 新词(Day0)
 */
function getTodayReviewWords(allWords) {
  // 双重保护：如果今日测试已完成，不再加载任何单词
  if (getTodayQuizStatus()) {
    return [];
  }

  const progress = parseReviewFile();
  const today = getTodayDateCST();
  
  // 收集所有到期单词，按批次分组
  // 批次key = reviewCount + '_' + nextReviewDate
  const batches = new Map(); // key -> [words]
  const newWords = [];       // 新单词
  
  const { intervals: cfgIntervalsReview, stageNames: cfgStageNamesReview } = getConfig();
  
  for (const word of allWords) {
    const wordText = word.word;
    const data = progress.get(wordText);
    
    if (!data) {
      // 新单词
      newWords.push({ ...word, reviewCount: 0, lastReviewDate: null, nextReviewDate: null, isNew: true });
    } else if (data.reviewCount >= cfgIntervalsReview.length) {
      // 已完成所有阶段（毕业），跳过
      continue;
    } else if (!data.nextReviewDate || data.nextReviewDate <= today) {
      // 到期需要复习，按批次分组
      const batchKey = `${data.reviewCount}_${data.nextReviewDate || 'none'}`;
      if (!batches.has(batchKey)) {
        batches.set(batchKey, []);
      }
      batches.get(batchKey).push({ 
        ...word, 
        reviewCount: data.reviewCount, 
        lastReviewDate: data.lastReviewDate, 
        nextReviewDate: data.nextReviewDate, 
        isNew: false 
      });
    }
  }
  
  // 有到期批次：按 reviewCount 降序（毕业考优先），同阶段按到期日期升序（逾期久的优先）
  if (batches.size > 0) {
    const sortedBatches = Array.from(batches.entries())
      .sort((a, b) => {
        const countA = parseInt(a[0].split('_')[0]);
        const countB = parseInt(b[0].split('_')[0]);
        if (countA !== countB) return countB - countA; // 降序，高阶段优先
        const dateA = a[0].split('_')[1];
        const dateB = b[0].split('_')[1];
        return dateA.localeCompare(dateB); // 升序，逾期久的优先
      });
    
    // 返回最高优先级的整个批次（15个一组）
    const batch = sortedBatches[0][1];
    const batchKey = sortedBatches[0][0];
    const stage = parseInt(batchKey.split('_')[0]);
    const wordList = batch.map(w => w.word).join(', ');
    const logKey = `batch_${batchKey}_${wordList}`;
    if (_lastLogDate !== today || _lastLogBatchKey !== logKey) {
      const cfg = getConfig();
      logEbbinghaus('加载批次', `阶段=${cfg.stageNames[stage] || stage} | 单词数=${batch.length} | 单词=[${wordList}] | 待复习批次数=${batches.size}`);
      _lastLogDate = today;
      _lastLogBatchKey = logKey;
    }
    return batch;
  }
  
  // 没有到期批次，取新单词（不超过 dailyLimit）
  const { dailyLimit } = getConfig();
  const batch = newWords.slice(0, dailyLimit);
  if (batch.length > 0) {
    const wordList = batch.map(w => w.word).join(', ');
    const logKey = `new_${wordList}`;
    if (_lastLogDate !== today || _lastLogBatchKey !== logKey) {
      logEbbinghaus('加载新批', `阶段=Day 0 首学 | 单词数=${batch.length} | 单词=[${wordList}] | 剩余新词=${newWords.length - batch.length}`);
      _lastLogDate = today;
      _lastLogBatchKey = logKey;
    }
  } else {
    if (_lastLogDate !== today || _lastLogBatchKey !== 'empty') {
      logEbbinghaus('无任务', `无到期批次且无新词`);
      _lastLogDate = today;
      _lastLogBatchKey = 'empty';
    }
  }
  return batch;
}

/**
 * 记录复习结果
 */
function recordReview(word, remembered) {
  const progress = parseReviewFile();
  const today = getTodayDateCST();
  const time = getNowTimeCST();
  
  let data = progress.get(word) || { reviewCount: 0, lastReviewDate: null, nextReviewDate: null };
  const oldCount = data.reviewCount;
  const oldNext = data.nextReviewDate;
  const logs = [];
  const { intervals: cfgIntervals, stageNames: cfgStageNames } = getConfig();
  
  if (remembered) {
    data.reviewCount += 1;
    data.lastReviewDate = today;
    
    if (data.reviewCount < cfgIntervals.length) {
      const interval = cfgIntervals[data.reviewCount];
      data.nextReviewDate = getDateAfterDaysCST(interval);
    } else {
      data.nextReviewDate = null;
    }
    
    logs.push({ time, word, remembered: true, count: data.reviewCount });
    
    // 记录状态迁移
    const fromStage = cfgStageNames[oldCount] || `Stage ${oldCount}`;
    const toStage = data.reviewCount >= cfgIntervals.length ? '✅ 毕业' : (cfgStageNames[data.reviewCount] || `Stage ${data.reviewCount}`);
    const nextInfo = data.nextReviewDate ? `下次复习=${data.nextReviewDate}` : '已完成全部复习';
    logEbbinghaus('状态迁移', `单词=${word} | ${fromStage} → ${toStage} | ${nextInfo}`);
  } else {
    logs.push({ time, word, remembered: false, count: data.reviewCount });
    logEbbinghaus('未记住', `单词=${word} | 保持=${cfgStageNames[data.reviewCount] || `Stage ${data.reviewCount}`}`);
  }
  
  progress.set(word, data);
  saveReviewFile(progress, logs);
  
  return {
    reviewCount: data.reviewCount,
    lastReviewDate: data.lastReviewDate,
    nextReviewDate: data.nextReviewDate,
    completed: data.reviewCount >= cfgIntervals.length
  };
}

/**
 * 获取今日测试完成状态
 */
function getTodayQuizStatus() {
  const today = getTodayDateCST();
  const statusFile = path.join(OBSIDIAN_PATH, '.quiz-status.json');
  
  try {
    if (fs.existsSync(statusFile)) {
      const data = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
      return data.completedDate === today;
    }
  } catch (error) {
    console.error('读取测试状态失败:', error.message);
  }
  return false;
}

/**
 * 标记今日测试完成
 */
function markTodayQuizComplete() {
  const today = getTodayDateCST();
  const statusFile = path.join(OBSIDIAN_PATH, '.quiz-status.json');
  
  try {
    fs.writeFileSync(statusFile, JSON.stringify({ completedDate: today }), 'utf-8');
    logEbbinghaus('测试通过', `今日任务完成`);
    return true;
  } catch (error) {
    console.error('保存测试状态失败:', error.message);
    return false;
  }
}

/**
 * 获取复习统计
 */
function getReviewStats(allWords) {
  const progress = parseReviewFile();
  const today = getTodayDateCST();
  const quizCompleted = getTodayQuizStatus();
  const { intervals, dailyLimit } = getConfig();
  
  let todayReviewed = 0;
  let totalDue = 0;        // 总共到期待复习数
  let totalMastered = 0;
  
  for (const word of allWords) {
    const data = progress.get(word.word);
    
    if (!data) {
      totalDue += 1;
    } else if (data.reviewCount >= intervals.length) {
      totalMastered += 1;
    } else if (data.lastReviewDate === today) {
      todayReviewed += 1;
    } else if (!data.nextReviewDate || data.nextReviewDate <= today) {
      totalDue += 1;
    }
  }
  
  // 如果今日测试已完成，剩余数量为0
  // 否则显示今日任务总量（不因翻卡减少）
  const todayRemaining = quizCompleted 
    ? 0 
    : Math.min(totalDue, dailyLimit);
  
  return { todayReviewed, todayRemaining, totalDue, totalMastered, total: allWords.length, quizCompleted };
}

module.exports = {
  getTodayReviewWords,
  recordReview,
  getReviewStats,
  parseReviewFile,
  getTodayQuizStatus,
  markTodayQuizComplete,
  REVIEW_FILE
};
