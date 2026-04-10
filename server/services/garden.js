/**
 * 花园服务
 * 管理可可的单词花园状态：浇水、使用道具、成长阶段等
 */

const fs = require('fs');
const path = require('path');
const obsidianService = require('./obsidian');
const { getTodayDateCST, getDateBeforeDaysCST } = require('../utils/date');

const GARDEN_STATE_FILE = path.join(
  '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本',
  '花园状态.json'
);

const stages = [
  { name: 'seed', label: '🌱 小种子', minWords: 0, waterNeeded: 20 },
  { name: 'sprout', label: '🌿 小树苗', minWords: 10, waterNeeded: 40 },
  { name: 'smallTree', label: '🌲 小树', minWords: 30, waterNeeded: 60 },
  { name: 'bigTree', label: '🌳 大树', minWords: 60, waterNeeded: 80 },
  { name: 'flowerTree', label: '🌸 开花树', minWords: 100, waterNeeded: 100 },
  { name: 'treeHouse', label: '🏡 树屋', minWords: 150, waterNeeded: 150 },
  { name: 'worldTree', label: '👑 世界树', minWords: 250, waterNeeded: 0 },
];

const DEFAULT_STATE = {
  treeStage: 0,
  waterCount: 0,
  stageProgress: 0,
  resources: { water: 10, sunshine: 0, fertilizer: 0 },
  sunshineActive: false,
  fertilizerActive: false,
  lastWaterDate: null,
  consecutiveDays: 0,
  growthHistory: [],
};

/**
 * 读取花园状态，不存在则创建默认状态
 */
function getGardenStatus() {
  try {
    if (!fs.existsSync(GARDEN_STATE_FILE)) {
      saveState(DEFAULT_STATE);
      return { ...DEFAULT_STATE, stages, masteredCount: 0 };
    }
    const raw = fs.readFileSync(GARDEN_STATE_FILE, 'utf-8');
    const state = JSON.parse(raw);
    // 获取已掌握单词数
    let masteredCount = 0;
    try {
      const fruits = getFruits();
      masteredCount = fruits.length;
    } catch (e) { /* ignore */ }
    return { ...state, stages, masteredCount };
  } catch (err) {
    console.error('读取花园状态失败:', err.message);
    saveState(DEFAULT_STATE);
    return { ...DEFAULT_STATE, stages, masteredCount: 0 };
  }
}

/**
 * 保存花园状态（不含 stages 元数据）
 */
function saveState(state) {
  const { stages: _ignored, ...toSave } = state;
  const dir = path.dirname(GARDEN_STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(GARDEN_STATE_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
}

/**
 * 浇水
 * 消耗 1 水滴，进度 +1（阳光 active 则 +2，肥料 active 则 +5）
 * 两者都 active 时叠加：+1 * 2 * 5 = +10
 * 检查是否升级阶段
 */
function water() {
  const status = getGardenStatus();

  if (status.resources.water <= 0) {
    return { success: false, message: '没有水滴了！' };
  }

  // 已达最高阶段
  const currentStage = stages[status.treeStage];
  if (currentStage.name === 'worldTree') {
    return { success: false, message: '已经是世界树了，不需要再浇水！' };
  }

  // 消耗 1 水滴
  status.resources.water -= 1;
  status.waterCount += 1;

  // 计算进度增量
  let increment = 1;
  if (status.sunshineActive) {
    increment *= 2;
    status.sunshineActive = false; // 用完一次
  }
  if (status.fertilizerActive) {
    increment *= 5;
    status.fertilizerActive = false; // 用完一次
  }
  status.stageProgress += increment;

  // 连续浇水天数
  const today = getTodayDateCST();
  if (status.lastWaterDate === today) {
    // 同一天，不增加连续天数
  } else {
    const yesterday = getDateBeforeDaysCST(1);
    if (status.lastWaterDate === yesterday) {
      status.consecutiveDays += 1;
    } else {
      status.consecutiveDays = 1;
    }
    status.lastWaterDate = today;
  }

  // 检查是否升级
  let leveledUp = false;
  const waterNeeded = stages[status.treeStage].waterNeeded;
  if (waterNeeded > 0 && status.stageProgress >= waterNeeded) {
    // 检查已记住单词数是否满足下一阶段要求
    const nextStageIndex = status.treeStage + 1;
    if (nextStageIndex < stages.length) {
      const nextStage = stages[nextStageIndex];
      const fruits = getFruits();
      const learnedCount = fruits.length;

      if (learnedCount >= nextStage.minWords) {
        status.treeStage = nextStageIndex;
        status.stageProgress = 0;
        leveledUp = true;
        status.growthHistory.push({
          stage: nextStage.name,
          label: nextStage.label,
          date: today,
          totalWords: learnedCount,
        });
      }
      // 如果单词数不够，进度停在 waterNeeded（封顶）
      else {
        status.stageProgress = waterNeeded;
      }
    }
  }

  saveState(status);

  return {
    success: true,
    increment,
    leveledUp,
    currentStage: stages[status.treeStage],
    stageProgress: status.stageProgress,
    waterNeeded: stages[status.treeStage].waterNeeded,
    resources: status.resources,
    consecutiveDays: status.consecutiveDays,
  };
}

/**
 * 使用阳光道具 — 下次浇水效果 x2
 */
function useSunshine() {
  const status = getGardenStatus();

  if (status.resources.sunshine <= 0) {
    return { success: false, message: '没有阳光了！' };
  }

  if (status.sunshineActive) {
    return { success: false, message: '阳光效果已经激活了！' };
  }

  status.resources.sunshine -= 1;
  status.sunshineActive = true;
  saveState(status);

  return { success: true, message: '☀️ 阳光已激活！下次浇水效果 x2', resources: status.resources };
}

/**
 * 使用肥料道具 — 下次浇水效果 x5
 */
function useFertilizer() {
  const status = getGardenStatus();

  if (status.resources.fertilizer <= 0) {
    return { success: false, message: '没有肥料了！' };
  }

  if (status.fertilizerActive) {
    return { success: false, message: '肥料效果已经激活了！' };
  }

  status.resources.fertilizer -= 1;
  status.fertilizerActive = true;
  saveState(status);

  return { success: true, message: '🧪 肥料已激活！下次浇水效果 x5', resources: status.resources };
}

/**
 * 添加资源
 * @param {'water'|'sunshine'|'fertilizer'} type
 * @param {number} amount
 */
function addResources(type, amount) {
  const validTypes = ['water', 'sunshine', 'fertilizer'];
  if (!validTypes.includes(type)) {
    return { success: false, message: `无效的资源类型: ${type}` };
  }
  if (!amount || amount <= 0) {
    return { success: false, message: '数量必须大于 0' };
  }

  const status = getGardenStatus();
  status.resources[type] += amount;
  saveState(status);

  return { success: true, message: `已添加 ${amount} ${type}`, resources: status.resources };
}

/**
 * 获取果实（已记住的单词列表）
 */
function getFruits() {
  try {
    const learned = obsidianService.getLearnedWords();
    return learned;
  } catch (err) {
    console.error('获取果实失败:', err.message);
    return [];
  }
}

module.exports = {
  getGardenStatus,
  water,
  useSunshine,
  useFertilizer,
  addResources,
  getFruits,
  stages,
};
