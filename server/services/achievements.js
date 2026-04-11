// server/services/achievements.js
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

const ACHIEVEMENTS_FILE = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/成就记录.md'

// 成就定义
const ACHIEVEMENTS = [
  // 入门系列
  { id: 'first_review', name: '初次启航', icon: '⛵', category: '入门', condition: '完成第一次复习' },
  { id: 'first_perfect', name: '完美起步', icon: '🎯', category: '入门', condition: '首次测试全对' },
  { id: 'first_mastery', name: '第一颗珍珠', icon: '🦪', category: '入门', condition: '掌握第一个单词' },
  // 坚持系列
  { id: 'streak_3', name: '三日水手', icon: '🚣', category: '坚持', condition: '连续学习3天' },
  { id: 'streak_7', name: '周冠军', icon: '🏅', category: '坚持', condition: '连续学习7天' },
  { id: 'streak_30', name: '月度传奇', icon: '👑', category: '坚持', condition: '连续学习30天' },
  // 数量系列
  { id: 'words_10', name: '十词达人', icon: '📖', category: '数量', condition: '掌握10个单词' },
  { id: 'words_50', name: '五十勇士', icon: '⚔️', category: '数量', condition: '掌握50个单词' },
  { id: 'words_100', name: '百词王者', icon: '🏆', category: '数量', condition: '掌握100个单词' },
  { id: 'words_200', name: '双百传奇', icon: '🌟', category: '数量', condition: '掌握200个单词' },
  // 完美系列
  { id: 'perfect_once', name: '零失误', icon: '💯', category: '完美', condition: '单次测试全对' },
  { id: 'perfect_5', name: '五连完美', icon: '🔥', category: '完美', condition: '连续5次测试全对' },
  // 积分系列
  { id: 'points_100', name: '百分新手', icon: '💰', category: '积分', condition: '累计100分' },
  { id: 'points_1000', name: '千分大师', icon: '💎', category: '积分', condition: '累计1000分' },
  { id: 'points_5000', name: '五千富翁', icon: '🤑', category: '积分', condition: '累计5000分' },
  // 收藏系列
  { id: 'first_purchase', name: '首次购物', icon: '🛒', category: '收藏', condition: '解锁第一个商品' },
  { id: 'skins_3', name: '时尚达人', icon: '👗', category: '收藏', condition: '集齐3个多多皮肤' }
]

async function ensureFile() {
  try {
    await fs.access(ACHIEVEMENTS_FILE)
  } catch {
    const initial = `# 成就记录

## 已获得成就
| 徽章 | 名称 | 获得日期 |
|------|------|---------|

## 进度追踪
- 连续学习天数：0
- 最后学习日期：无
- 连续全对次数：0
- 已掌握单词数：0
- 总购买商品数：0
- 多多皮肤数量：0
`
    await fs.writeFile(ACHIEVEMENTS_FILE, initial, 'utf-8')
  }
}

// 从复习记录计算连续学习天数
async function calcStreakDays() {
  try {
    const reviewContent = await fs.readFile('/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/复习记录.md', 'utf-8')
    // 提取所有有复习记录的日期
    const dates = new Set()
    const lines = reviewContent.split('\n')
    for (const line of lines) {
      const match = line.match(/^### (\d{4}-\d{2}-\d{2})/)
      if (match) dates.add(match[1])
    }
    if (dates.size === 0) return 0
    
    // 从今天往回数连续天数
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const dateStr = getDateBeforeDaysCST(i)
      if (dates.has(dateStr)) {
        streak++
      } else if (i > 0) {
        break // 断了
      }
      // i===0 且今天没学也继续往前看（可能还没学）
    }
    return streak
  } catch {
    return 0
  }
}

// 从 Obsidian 计算已掌握单词数
async function calcMasteredWords() {
  try {
    const content = await fs.readFile('/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/已记住单词.md', 'utf-8')
    const matches = content.match(/^\|\s*[^|\-][^|]*\|/gm)
    // 减去表头行
    return matches ? Math.max(0, matches.length - matches.filter(m => m.includes('单词')).length) : 0
  } catch {
    return 0
  }
}

// 从商店配置计算购买数量
async function calcPurchases() {
  try {
    const content = await fs.readFile('/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/商店配置.md', 'utf-8')
    // 数已解锁商品（排除 default）
    const unlockedMatch = content.match(/## 已解锁商品([\s\S]*?)(?=\n##)/)
    if (!unlockedMatch) return { purchases: 0, skins: 0 }
    const items = unlockedMatch[1].match(/[a-z_]+/g) || []
    const nonDefault = items.filter(i => i !== 'default' && i !== 'none')
    
    // 数多多皮肤
    const skinMatch = content.match(/多多皮肤：(.+)/)
    const skins = skinMatch ? skinMatch[1].split(/[,，]/).map(s => s.trim()).filter(s => s && s !== 'default').length : 0
    
    return { purchases: nonDefault.length, skins }
  } catch {
    return { purchases: 0, skins: 0 }
  }
}

async function getAchievements() {
  await ensureFile()
  const content = await fs.readFile(ACHIEVEMENTS_FILE, 'utf-8')
  
  // 解析已获得的成就
  const unlocked = []
  const tableMatch = content.match(/## 已获得成就\n\|[^\n]+\n\|[^\n]+\n([\s\S]*?)(?=\n##|$)/)
  if (tableMatch) {
    const rows = tableMatch[1].trim().split('\n').filter(r => r.startsWith('|'))
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean)
      if (cols.length >= 3) {
        const achievement = ACHIEVEMENTS.find(a => a.name === cols[1])
        if (achievement) {
          unlocked.push({ ...achievement, unlockedAt: cols[2] })
        }
      }
    }
  }
  
  // 实时计算进度（不依赖文件中的静态数字）
  const streakDays = await calcStreakDays()
  const masteredWords = await calcMasteredWords()
  const { purchases: totalPurchases, skins: dolphinSkins } = await calcPurchases()
  
  // 从文件读取无法实时计算的字段
  const perfectMatch = content.match(/- 连续全对次数：(\d+)/)
  const perfectStreak = perfectMatch ? parseInt(perfectMatch[1]) : 0
  
  const progress = {
    streakDays,
    perfectStreak,
    masteredWords,
    totalPurchases,
    dolphinSkins
  }
  
  // 同步更新文件中的进度
  let updatedContent = content
  updatedContent = updatedContent.replace(/- 连续学习天数：.+/, `- 连续学习天数：${streakDays}`)
  updatedContent = updatedContent.replace(/- 已掌握单词数：.+/, `- 已掌握单词数：${masteredWords}`)
  updatedContent = updatedContent.replace(/- 总购买商品数：.+/, `- 总购买商品数：${totalPurchases}`)
  updatedContent = updatedContent.replace(/- 多多皮肤数量：.+/, `- 多多皮肤数量：${dolphinSkins}`)
  if (updatedContent !== content) {
    await withFileLock(ACHIEVEMENTS_FILE, async () => {
      await safeWriteFile(ACHIEVEMENTS_FILE, updatedContent)
    })
  }
  
  // 构建完整列表（已解锁 + 未解锁）
  const all = ACHIEVEMENTS.map(a => {
    const unlockedItem = unlocked.find(u => u.id === a.id)
    return {
      ...a,
      unlocked: !!unlockedItem,
      unlockedAt: unlockedItem?.unlockedAt || null
    }
  })
  
  return { achievements: all, progress, unlockedCount: unlocked.length, totalCount: ACHIEVEMENTS.length }
}

async function unlockBatch(ids) {
  await ensureFile()
  let content = await fs.readFile(ACHIEVEMENTS_FILE, 'utf-8')
  const date = getTodayDateCST()
  const unlocked = []

  for (const id of ids) {
    const achievement = ACHIEVEMENTS.find(a => a.id === id)
    if (!achievement) continue
    // Skip already unlocked
    if (content.includes(`| ${achievement.icon} | ${achievement.name} |`)) continue

    const newRow = `| ${achievement.icon} | ${achievement.name} | ${date} |`
    const lines = content.split('\n')
    const headerIndex = lines.findIndex(l => l.includes('| 徽章 | 名称 | 获得日期 |'))
    if (headerIndex >= 0) {
      const separatorIndex = headerIndex + 1
      lines.splice(separatorIndex + 1, 0, newRow)
      content = lines.join('\n')
      unlocked.push(achievement)
    }
  }

  if (unlocked.length > 0) {
    await fs.writeFile(ACHIEVEMENTS_FILE, content, 'utf-8')
  }

  return { success: true, unlocked }
}

async function unlockAchievement(achievementId) {
  return withFileLock(ACHIEVEMENTS_FILE, async () => {
  await ensureFile()
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
  if (!achievement) return { success: false, error: '成就不存在' }
  
  let content = await fs.readFile(ACHIEVEMENTS_FILE, 'utf-8')
  
  // 检查是否已解锁
  if (content.includes(`| ${achievement.icon} | ${achievement.name} |`)) {
    return { success: false, error: '成就已解锁' }
  }
  
  // 添加到已获得成就表格
  const date = getTodayDateCST()
  const newRow = `| ${achievement.icon} | ${achievement.name} | ${date} |`
  
  // 在表格标题行后插入
  const lines = content.split('\n')
  const headerIndex = lines.findIndex(l => l.includes('| 徽章 | 名称 | 获得日期 |'))
  if (headerIndex >= 0) {
    // 找到分隔行
    const separatorIndex = headerIndex + 1
    lines.splice(separatorIndex + 1, 0, newRow)
  }
  
  await safeWriteFile(ACHIEVEMENTS_FILE, lines.join('\n'))
  
  return { success: true, achievement }
  }) // end withFileLock
}

async function updateProgress(field, value) {
  return withFileLock(ACHIEVEMENTS_FILE, async () => {
  await ensureFile()
  let content = await fs.readFile(ACHIEVEMENTS_FILE, 'utf-8')
  
  const fieldMap = {
    streakDays: '连续学习天数',
    lastStudyDate: '最后学习日期',
    perfectStreak: '连续全对次数',
    masteredWords: '已掌握单词数',
    totalPurchases: '总购买商品数',
    dolphinSkins: '多多皮肤数量'
  }
  
  const label = fieldMap[field]
  if (!label) return { success: false, error: '无效字段' }
  
  const regex = new RegExp(`- ${label}：.+`)
  content = content.replace(regex, `- ${label}：${value}`)
  
  await safeWriteFile(ACHIEVEMENTS_FILE, content)
  return { success: true }
  }) // end withFileLock
}

module.exports = {
  ACHIEVEMENTS,
  getAchievements,
  unlockAchievement,
  unlockBatch,
  updateProgress
}
