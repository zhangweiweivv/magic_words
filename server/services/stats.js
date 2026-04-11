// server/services/stats.js
const fs = require('fs').promises
const path = require('path')
const { getTodayDateCST, getDateBeforeDaysCST, toDateStrCST } = require('../utils/date')
const { withFileLock } = require('../utils/fileLock')

// Atomic write: write to temp file then rename
async function safeWriteFile(filePath, content) {
  const tempFile = filePath + '.tmp'
  await fs.writeFile(tempFile, content, 'utf-8')
  await fs.rename(tempFile, filePath)
}

const STATS_FILE = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/学习统计.md'

async function ensureFile() {
  try {
    await fs.access(STATS_FILE)
  } catch {
    const initial = `# 学习统计

> 此文件由可可单词网站自动维护，请勿手动编辑

## 每日记录
| 日期 | 复习单词数 | 测试正确率 | 获得积分 |
|------|-----------|-----------|---------|

## 单词错误统计
| 单词 | 错误次数 | 最近错误日期 |
|------|---------|-------------|
`
    // 确保目录存在
    const dir = require('path').dirname(STATS_FILE)
    try {
      await fs.access(dir)
    } catch {
      await fs.mkdir(dir, { recursive: true })
    }
    await fs.writeFile(STATS_FILE, initial, 'utf-8')
  }
}

async function getDailyStats() {
  await ensureFile()
  const content = await fs.readFile(STATS_FILE, 'utf-8')
  
  const dailyRecords = []
  const dailyMatch = content.match(/## 每日记录\n+\|[^\n]+\n\|[^\n]+\n([\s\S]*?)(?=\n##|$)/)
  if (dailyMatch) {
    const rows = dailyMatch[1].trim().split('\n').filter(r => r.startsWith('|'))
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean)
      if (cols.length >= 4) {
        dailyRecords.push({
          date: cols[0],
          wordsReviewed: parseInt(cols[1]) || 0,
          accuracy: cols[2],
          points: parseInt(cols[3]) || 0
        })
      }
    }
  }
  
  return dailyRecords
}

async function getWeakWords() {
  await ensureFile()
  const content = await fs.readFile(STATS_FILE, 'utf-8')
  
  const weakWords = []
  const weakMatch = content.match(/## 单词错误统计\n\|[^\n]+\n\|[^\n]+\n([\s\S]*?)(?=\n##|$)/)
  if (weakMatch) {
    const rows = weakMatch[1].trim().split('\n').filter(r => r.startsWith('|'))
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean)
      if (cols.length >= 3) {
        weakWords.push({
          word: cols[0],
          errorCount: parseInt(cols[1]) || 0,
          lastError: cols[2]
        })
      }
    }
  }
  
  // 按错误次数排序，取前10
  return weakWords.sort((a, b) => b.errorCount - a.errorCount).slice(0, 10)
}

async function recordDailyStats(date, wordsReviewed, accuracy, points) {
  return withFileLock(STATS_FILE, async () => {
  await ensureFile()
  let content = await fs.readFile(STATS_FILE, 'utf-8')
  
  // 检查是否已有当天记录
  const existingRegex = new RegExp(`\\| ${date} \\|[^\\n]+`)
  if (existingRegex.test(content)) {
    // 更新现有记录 - 累加单词数和积分
    const existingMatch = content.match(existingRegex)
    if (existingMatch) {
      const cols = existingMatch[0].split('|').map(c => c.trim()).filter(Boolean)
      const prevWords = parseInt(cols[1]) || 0
      const prevPoints = parseInt(cols[3]) || 0
      const newWords = prevWords + wordsReviewed
      const newPoints = prevPoints + points
      content = content.replace(existingRegex, `| ${date} | ${newWords} | ${accuracy} | ${newPoints} |`)
    }
  } else {
    // 添加新记录
    const newRow = `| ${date} | ${wordsReviewed} | ${accuracy} | ${points} |`
    const lines = content.split('\n')
    const headerIndex = lines.findIndex(l => l.includes('| 日期 |'))
    if (headerIndex >= 0) {
      lines.splice(headerIndex + 2, 0, newRow)
    }
    content = lines.join('\n')
  }
  
  await safeWriteFile(STATS_FILE, content)
  return { success: true }
  }) // end withFileLock
}

async function recordWordError(word) {
  return withFileLock(STATS_FILE, async () => {
  await ensureFile()
  let content = await fs.readFile(STATS_FILE, 'utf-8')
  const date = getTodayDateCST()
  
  // 检查是否已有该单词记录
  const existingRegex = new RegExp(`\\| ${word} \\| (\\d+) \\|[^\\n]+`)
  const match = content.match(existingRegex)
  
  if (match) {
    // 更新错误次数
    const newCount = parseInt(match[1]) + 1
    content = content.replace(existingRegex, `| ${word} | ${newCount} | ${date} |`)
  } else {
    // 添加新记录
    const newRow = `| ${word} | 1 | ${date} |`
    const lines = content.split('\n')
    const headerIndex = lines.findIndex(l => l.includes('| 单词 | 错误次数'))
    if (headerIndex >= 0) {
      lines.splice(headerIndex + 2, 0, newRow)
    }
    content = lines.join('\n')
  }
  
  await safeWriteFile(STATS_FILE, content)
  return { success: true }
  }) // end withFileLock
}

async function getStudyCalendar() {
  // 从复习记录中提取每日学习的单词数
  const reviewFile = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/复习记录.md'
  try {
    const content = await fs.readFile(reviewFile, 'utf-8')
    const calendar = {}
    const lines = content.split('\n')
    for (const line of lines) {
      if (!line.startsWith('|')) continue
      const cols = line.split('|').map(c => c.trim()).filter(Boolean)
      // cols: [单词, 复习次数, 上次复习, 下次复习]
      if (cols.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(cols[2])) {
        const date = cols[2]
        calendar[date] = (calendar[date] || 0) + 1
      }
    }
    return calendar
  } catch {
    return {}
  }
}

function calculateStreak(dailyRecords) {
  if (dailyRecords.length === 0) return 0
  
  const dates = new Set(dailyRecords.map(r => r.date))
  const today = getTodayDateCST()
  
  // 从今天或昨天开始（今天还没学的话从昨天算）
  let startDate = today
  if (!dates.has(today)) {
    startDate = getDateBeforeDaysCST(1)
    if (!dates.has(startDate)) return 0
  }
  
  let streak = 0
  // 从 startDate 往前推
  const d = new Date(startDate + 'T12:00:00+08:00') // 用正午避免时区边界
  for (let i = 0; i < 365; i++) {
    const dateStr = toDateStrCST(d)
    if (dates.has(dateStr)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}

async function getSummary() {
  const dailyRecords = await getDailyStats()
  const weakWords = await getWeakWords()
  
  const today = getTodayDateCST()
  const weekAgo = getDateBeforeDaysCST(7)
  const monthAgo = getDateBeforeDaysCST(30)
  
  const todayRecord = dailyRecords.find(r => r.date === today)
  const weekRecords = dailyRecords.filter(r => r.date >= weekAgo)
  const monthRecords = dailyRecords.filter(r => r.date >= monthAgo)
  
  return {
    todayWords: todayRecord?.wordsReviewed || 0,
    weekWords: weekRecords.reduce((sum, r) => sum + r.wordsReviewed, 0),
    monthWords: monthRecords.reduce((sum, r) => sum + r.wordsReviewed, 0),
    streakDays: calculateStreak(dailyRecords),
    weakWords
  }
}

module.exports = {
  ensureFile,
  getDailyStats,
  getWeakWords,
  recordDailyStats,
  recordWordError,
  getStudyCalendar,
  getSummary
}
