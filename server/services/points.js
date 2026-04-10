// server/services/points.js
const fs = require('fs').promises
const { getTodayDateCST, getNowTimeCST } = require('../utils/date')

const POINTS_FILE = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/积分记录.md'

// 等级定义
const LEVELS = [
  { level: 1, name: '🐚 小贝壳', minPoints: 0 },
  { level: 2, name: '🐠 小鱼儿', minPoints: 100 },
  { level: 3, name: '🐬 海豚宝宝', minPoints: 300 },
  { level: 4, name: '🦈 小鲨鱼', minPoints: 600 },
  { level: 5, name: '🐋 蓝鲸王子', minPoints: 1000 },
  { level: 6, name: '👑 海洋之王', minPoints: 2000 }
]

// 积分规则
const POINT_RULES = {
  REVIEW_WORD: 1,           // 翻卡确认"记住了"
  QUIZ_CHOICE_CORRECT: 2,   // 选择题答对
  QUIZ_SPELL_CORRECT: 3,    // 拼写题答对
  STREAK_BONUS: 1,          // 连击奖励
  PERFECT_QUIZ: 10,         // 测试全对额外奖励
  MASTERY_WORD: 5,          // Day 7 掌握单词
  DAILY_COMPLETE: 20        // 每日任务完成
}

// 从历史记录表格中计算实际积分（单一数据源，不依赖头部状态行）
function calcPointsFromHistory(content) {
  let total = 0
  let spent = 0
  const lines = content.split('\n')
  for (const line of lines) {
    if (!line.startsWith('|')) continue
    // 匹配 +N 或 -N
    const match = line.match(/\|\s*([+-]\d+)\s*\|/)
    if (match) {
      const val = parseInt(match[1])
      if (val > 0) total += val
      else spent += Math.abs(val)
    }
  }
  return { total, spent, available: total - spent }
}

async function ensureFile() {
  try {
    await fs.access(POINTS_FILE)
  } catch {
    const initial = `# 积分记录

> 此文件由可可单词网站自动维护，请勿手动编辑

## 当前积分: 0

## 历史记录

| 日期 | 时间 | 行为 | 积分 | 备注 |
|------|------|------|------|------|
`
    await fs.writeFile(POINTS_FILE, initial, 'utf-8')
  }
}

async function getPointsData() {
  await ensureFile()
  const content = await fs.readFile(POINTS_FILE, 'utf-8')
  
  // 从历史记录计算真实积分（不依赖头部数字）
  const { total, available } = calcPointsFromHistory(content)
  
  // 计算等级
  let currentLevel = 1
  for (const l of LEVELS) {
    if (total >= l.minPoints) currentLevel = l.level
  }
  const levelInfo = LEVELS.find(l => l.level === currentLevel) || LEVELS[0]
  const nextLevel = LEVELS.find(l => l.level === currentLevel + 1)
  
  // 解析历史记录
  const history = []
  const lines = content.split('\n')
  for (const line of lines) {
    if (!line.startsWith('|')) continue
    const cols = line.split('|').map(c => c.trim()).filter(Boolean)
    // cols: [日期, 时间, 行为, 积分, 备注]
    if (cols.length >= 5 && /^\d{4}-\d{2}-\d{2}$/.test(cols[0])) {
      history.push({
        timestamp: `${cols[0]}T${cols[1]}:00+08:00`,
        action: cols[2],
        points: parseInt(cols[3]) || 0,
        note: cols[4]
      })
    }
  }

  return {
    totalPoints: total,
    availablePoints: available,
    points: available,
    currentLevel,
    levelName: levelInfo.name,
    nextLevel: nextLevel ? {
      level: nextLevel.level,
      name: nextLevel.name,
      pointsNeeded: nextLevel.minPoints - total
    } : null,
    history: history.reverse()
  }
}

async function updateHeader(content, total, available) {
  // 更新头部的当前积分显示
  const headerMatch = content.match(/## 当前积分:\s*\d+/)
  if (headerMatch) {
    content = content.replace(/## 当前积分:\s*\d+/, `## 当前积分: ${available}`)
  }
  return content
}

async function addPoints(action, points, note = '') {
  await ensureFile()
  let content = await fs.readFile(POINTS_FILE, 'utf-8')
  
  // 添加历史记录
  
  const date = getTodayDateCST()
  const time = getNowTimeCST()
  const historyLine = `| ${date} | ${time} | ${action} | +${points} | ${note} |`
  
  // 在表格末尾添加
  const lines = content.split('\n')
  const tableEndIndex = lines.findIndex((line, i) => 
    i > 0 && lines[i-1].startsWith('|') && !line.startsWith('|')
  )
  if (tableEndIndex > 0) {
    lines.splice(tableEndIndex, 0, historyLine)
  } else {
    lines.push(historyLine)
  }
  content = lines.join('\n')
  
  // 重新计算积分并更新头部
  const { total, available } = calcPointsFromHistory(content)
  content = await updateHeader(content, total, available)
  
  // 计算等级
  let newLevel = 1
  for (const l of LEVELS) {
    if (total >= l.minPoints) newLevel = l.level
  }
  const levelInfo = LEVELS.find(l => l.level === newLevel)
  
  await fs.writeFile(POINTS_FILE, content, 'utf-8')
  
  return {
    totalPoints: total,
    availablePoints: available,
    currentLevel: newLevel,
    levelName: levelInfo.name,
    pointsAdded: points
  }
}

async function spendPoints(amount, item) {
  await ensureFile()
  let content = await fs.readFile(POINTS_FILE, 'utf-8')
  
  // 从历史计算真实可用积分
  const { available } = calcPointsFromHistory(content)
  
  if (available < amount) {
    return { success: false, error: '积分不足' }
  }
  
  // 添加消费记录
  
  const date = getTodayDateCST()
  const time = getNowTimeCST()
  const historyLine = `| ${date} | ${time} | 兑换商品 | -${amount} | ${item} |`
  
  const lines = content.split('\n')
  const tableEndIndex = lines.findIndex((line, i) => 
    i > 0 && lines[i-1].startsWith('|') && !line.startsWith('|')
  )
  if (tableEndIndex > 0) {
    lines.splice(tableEndIndex, 0, historyLine)
  } else {
    lines.push(historyLine)
  }
  content = lines.join('\n')
  
  // 重新计算并更新头部
  const calc = calcPointsFromHistory(content)
  content = await updateHeader(content, calc.total, calc.available)
  
  await fs.writeFile(POINTS_FILE, content, 'utf-8')
  
  return { success: true, availablePoints: calc.available }
}

module.exports = {
  LEVELS,
  POINT_RULES,
  getPointsData,
  addPoints,
  spendPoints
}
