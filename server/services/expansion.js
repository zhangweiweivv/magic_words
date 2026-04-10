// server/services/expansion.js
const fs = require('fs').promises

const path = require('path')

const EXPANSION_STATE_FILE = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/expansion-state.json'
const QUIZ_CONFIG_FILE = path.join(__dirname, '..', 'config', 'quiz-config.json')
const PET_VOCAB_FILE = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/PET官方单词库.md'
const UNLEARNED_FILE = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/未记住单词.md'
const LEARNED_FILE = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/已记住单词.md'
const TOTAL_AVAILABLE = 2813

/**
 * Get expansion config: prefer quiz-config.json > fallback to expansion-state.json
 */
async function getExpansionConfig() {
  try {
    const quizCfg = JSON.parse(await fs.readFile(QUIZ_CONFIG_FILE, 'utf-8'))
    if (quizCfg.expansionConfig) {
      return quizCfg.expansionConfig
    }
  } catch (e) {
    console.log('[expansion] Failed to read quiz-config.json, falling back:', e.message)
  }
  // Fallback to expansion-state.json config
  const state = JSON.parse(await fs.readFile(EXPANSION_STATE_FILE, 'utf-8'))
  return state.config
}

// Emoji pool for new words
const EMOJI_POOL = [
  '🌟', '⭐', '💫', '✨', '🎯', '🎨', '🎪', '🎭', '🎬', '🎵',
  '🎶', '🎸', '🎹', '🎺', '🎻', '🏆', '🏅', '🎖️', '🎗️', '🎁',
  '📚', '📖', '📝', '✏️', '🖊️', '🔍', '💡', '🧠', '🎓', '📌',
  '🌈', '🌸', '🌺', '🌻', '🌼', '🍀', '🌲', '🌴', '🦋', '🐬',
  '🐳', '🐙', '🦀', '🐠', '🐟', '🐢', '🦈', '🐚', '🐋', '🦑',
  '🚀', '✈️', '🚂', '🚗', '⛵', '🏠', '🏰', '🗼', '🌍', '🗺️',
  '☀️', '🌙', '⭐', '🌊', '🔥', '❄️', '🌪️', '⚡', '💎', '🔮',
  '🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍰', '🎂', '🍩'
]

/**
 * Parse PET vocabulary file into structured data by level
 * Returns: { A1: [{word, pos, rank}], A2: [...], B1: [...] }
 * B2/B2+ words are merged into the B1 pool
 */
async function parsePetVocab() {
  const content = await fs.readFile(PET_VOCAB_FILE, 'utf-8')
  const levels = { A1: [], A2: [], B1: [] }
  let currentLevel = null

  const lines = content.split('\n')
  for (const line of lines) {
    // Detect level headers
    const levelMatch = line.match(/## 🏷️ (A1|A2|B1|B2\+?) 级别/)
    if (levelMatch) {
      currentLevel = levelMatch[1]
      if (currentLevel === 'B2+' || currentLevel === 'B2') {
        currentLevel = 'B1' // merge B2+ into B1 pool
      }
      continue
    }

    if (!currentLevel || !levels[currentLevel]) continue

    // Parse table rows: | # | word | pos | rank |
    const rowMatch = line.match(/^\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|/)
    if (rowMatch) {
      const word = rowMatch[1].trim()
      const pos = rowMatch[2].trim()
      const rank = parseInt(rowMatch[3], 10)

      // Filter out phrases (containing spaces)
      if (word.includes(' ') || word.includes('/')) continue

      levels[currentLevel].push({ word: word.toLowerCase(), pos, rank })
    }
  }

  // Sort each level by rank (lower rank = higher frequency = learn first)
  for (const level of Object.keys(levels)) {
    levels[level].sort((a, b) => a.rank - b.rank)
  }

  return levels
}

/**
 * Extract all words from unlearned/learned markdown files
 */
async function extractExistingWords(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const words = new Set()
    const lines = content.split('\n')
    for (const line of lines) {
      // Match table rows: | word | meaning | ... |
      // The word is in the first column after |
      const match = line.match(/^\s*>\s*\|\s*([^|]+?)\s*\|/)
      if (match) {
        const word = match[1].trim()
        // Skip header rows
        if (word === '单词' || word === '短语' || word.startsWith('---') || word === '#') continue
        words.add(word.toLowerCase())
      }
    }
    return words
  } catch (e) {
    console.log(`[expansion] Failed to read ${filePath}:`, e.message)
    return new Set()
  }
}

/**
 * Fetch Chinese translation for a word via the local translate API
 */
async function fetchTranslation(word) {
  try {
    const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/translate/${encodeURIComponent(word)}`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data && data.data.translation) {
        return data.data.translation
      }
    }
  } catch (e) {
    console.log(`[expansion] Translation failed for "${word}":`, e.message)
  }
  return '待补充'
}

/**
 * Get a random emoji from the pool
 */
function getRandomEmoji() {
  return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]
}

/**
 * Get expansion status
 */
async function getExpansionStatus() {
  const content = await fs.readFile(EXPANSION_STATE_FILE, 'utf-8')
  const state = JSON.parse(content)
  const config = await getExpansionConfig()

  const lastDate = new Date(state.lastExpansion)
  const nextDate = new Date(lastDate)
  nextDate.setDate(nextDate.getDate() + config.intervalDays)
  const nextExpansion = nextDate.toISOString().split('T')[0]

  return {
    config,
    progress: state.progress,
    lastExpansion: state.lastExpansion,
    totalAdded: state.totalAdded,
    totalAvailable: TOTAL_AVAILABLE,
    nextExpansion
  }
}

/**
 * Main expansion logic: select new words from PET vocab and append to 未记住单词.md
 * @param {boolean} force - skip time check, force expansion now
 */
async function expandWords(force = false) {
  const stateContent = await fs.readFile(EXPANSION_STATE_FILE, 'utf-8')
  const state = JSON.parse(stateContent)
  const config = await getExpansionConfig()

  // Check if it's time to expand
  if (!force) {
    const lastDate = new Date(state.lastExpansion + 'T00:00:00+08:00')
    const nextDate = new Date(lastDate)
    nextDate.setDate(nextDate.getDate() + config.intervalDays)
    const now = new Date()
    if (now < nextDate) {
      return {
        expanded: false,
        message: '还没到扩充时间',
        nextExpansion: nextDate.toISOString().split('T')[0],
        totalAdded: state.totalAdded
      }
    }
  }

  // 1. Parse PET vocabulary (B2+ merged into B1)
  const petVocab = await parsePetVocab()

  // 2. Get existing words (both unlearned and learned)
  const [unlearnedWords, learnedWords] = await Promise.all([
    extractExistingWords(UNLEARNED_FILE),
    extractExistingWords(LEARNED_FILE)
  ])
  const existingWords = new Set([...unlearnedWords, ...learnedWords])

  // 3. Filter out existing words and get available words per level
  const available = {}
  for (const level of ['A1', 'A2', 'B1']) {
    available[level] = petVocab[level].filter(item => !existingWords.has(item.word))
  }

  // 4. Select words by ratio
  const { batchSize, ratio } = config
  const counts = {
    A1: Math.round(batchSize * ratio.A1),
    A2: Math.round(batchSize * ratio.A2),
    B1: Math.round(batchSize * ratio.B1)
  }

  // Adjust if a level doesn't have enough words
  const selected = []
  let deficit = 0
  for (const level of ['A1', 'A2', 'B1']) {
    const take = Math.min(counts[level], available[level].length)
    deficit += counts[level] - take
    selected.push(...available[level].slice(0, take).map(item => ({ ...item, level })))
  }

  // Redistribute deficit to levels that have more words
  if (deficit > 0) {
    for (const level of ['A1', 'A2', 'B1']) {
      const alreadyTaken = selected.filter(s => s.level === level).length
      const remaining = available[level].slice(alreadyTaken)
      const extra = Math.min(deficit, remaining.length)
      if (extra > 0) {
        selected.push(...remaining.slice(0, extra).map(item => ({ ...item, level })))
        deficit -= extra
      }
      if (deficit <= 0) break
    }
  }

  if (selected.length === 0) {
    return {
      expanded: false,
      message: '没有可扩充的新词了',
      totalAdded: state.totalAdded
    }
  }

  // 5. Fetch translations (serial to avoid rate limiting)
  for (const item of selected) {
    item.translation = await fetchTranslation(item.word)
    // Small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // 6. Build callout block
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }) // YYYY-MM-DD
  const lines = []
  lines.push('')
  lines.push(`> [!tip] 📅 ${today} PET单词库扩充`)
  lines.push('> | 单词 | 意思 | 记忆技巧 |')
  lines.push('> |------|------|----------|')

  for (const item of selected) {
    const emoji = getRandomEmoji()
    const levelTag = `[${item.level}]`
    const meaning = item.translation || '待补充'
    lines.push(`> | ${item.word} | ${meaning} | ${levelTag} ${item.pos} |`)
  }

  lines.push('')

  // 7. Append to 未记住单词.md (before the last --- and metadata)
  const unlearnedContent = await fs.readFile(UNLEARNED_FILE, 'utf-8')

  // Find insertion point: before the last "---" line followed by metadata
  // We insert before the trailing metadata section
  const trailingMetaMatch = unlearnedContent.match(/\n---\n\n\*最后更新.*\n\*待学习.*\n?$/)
  let newContent
  if (trailingMetaMatch) {
    const insertPos = unlearnedContent.lastIndexOf(trailingMetaMatch[0])
    newContent = unlearnedContent.slice(0, insertPos) +
      '\n---\n' + lines.join('\n') +
      '\n---\n\n' +
      `*最后更新：${today}*\n` +
      `*待学习：${unlearnedWords.size + selected.length} 个单词*\n`
  } else {
    // Fallback: append at end
    newContent = unlearnedContent.trimEnd() + '\n\n---\n' + lines.join('\n') + '\n'
  }

  await fs.writeFile(UNLEARNED_FILE, newContent, 'utf-8')

  // 8. Update expansion state
  const newProgress = { ...state.progress }
  for (const item of selected) {
    newProgress[item.level] = (newProgress[item.level] || 0) + 1
  }

  // Only save progress/state data to expansion-state.json (not config)
  const newState = {
    config: state.config, // keep legacy config for compatibility
    progress: newProgress,
    lastExpansion: today,
    totalAdded: state.totalAdded + selected.length
  }

  await fs.writeFile(EXPANSION_STATE_FILE, JSON.stringify(newState, null, 2), 'utf-8')

  // Summary by level
  const summary = {}
  for (const item of selected) {
    summary[item.level] = (summary[item.level] || 0) + 1
  }

  return {
    expanded: true,
    message: `成功扩充 ${selected.length} 个新词`,
    wordsAdded: selected.length,
    summary,
    words: selected.map(s => ({ word: s.word, level: s.level, translation: s.translation })),
    totalAdded: newState.totalAdded,
    nextExpansion: (() => {
      const next = new Date(today + 'T00:00:00+08:00')
      next.setDate(next.getDate() + config.intervalDays)
      return next.toISOString().split('T')[0]
    })()
  }
}

module.exports = {
  getExpansionStatus,
  expandWords
}
