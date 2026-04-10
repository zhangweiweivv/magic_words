// server/services/shop.js
const fs = require('fs').promises
const { getTodayDateCST } = require('../utils/date')

const SHOP_FILE = '/Users/vvhome/vv_obsidian/vv_obsidian/可可pet/可可单词本/商店配置.md'
const PARENT_PASSWORD = 'kk2017'

// 商品定义 - 6大类：皮肤8个、场景15个、特效15个、音乐5个、音效5个、卡片6个
const SHOP_ITEMS = {
  dolphinSkins: [
    { id: 'skin_pirate', name: '海盗船长多多', icon: '🏴‍☠️', price: 100 },
    { id: 'skin_santa', name: '圣诞老人多多', icon: '🎅', price: 100 },
    { id: 'skin_superhero', name: '超人多多', icon: '🦸', price: 150 },
    { id: 'skin_chef', name: '厨师多多', icon: '👨‍🍳', price: 80 },
    { id: 'skin_astronaut', name: '宇航员多多', icon: '🚀', price: 200 },
    { id: 'skin_wizard', name: '魔法师多多', icon: '🧙', price: 150 },
    { id: 'skin_detective', name: '侦探多多', icon: '🔍', price: 120 },
    { id: 'skin_rockstar', name: '摇滚明星多多', icon: '🎸', price: 180 }
  ],
  themes: [
    { id: 'theme_coral', name: '珊瑚礁花园', icon: '🪸', price: 150 },
    { id: 'theme_deep', name: '深海探险', icon: '🌑', price: 200 },
    { id: 'theme_arctic', name: '北极冰川', icon: '🧊', price: 200 },
    { id: 'theme_shipwreck', name: '沉船宝藏', icon: '🚢', price: 250 },
    { id: 'theme_castle', name: '海底城堡', icon: '🏰', price: 300 },
    { id: 'theme_beach', name: '热带海滩', icon: '🏖️', price: 150 },
    { id: 'theme_jellyfish', name: '水母森林', icon: '🪼', price: 180 },
    { id: 'theme_pirate_bay', name: '海盗湾', icon: '🏴‍☠️', price: 220 },
    { id: 'theme_atlantis', name: '亚特兰蒂斯', icon: '🔱', price: 350 },
    { id: 'theme_whale', name: '鲸鱼谷', icon: '🐋', price: 200 },
    { id: 'theme_turtle', name: '海龟沙滩', icon: '🐢', price: 150 },
    { id: 'theme_octopus', name: '章鱼花园', icon: '🐙', price: 180 },
    { id: 'theme_aurora', name: '极光海域', icon: '🌌', price: 280 },
    { id: 'theme_candy', name: '糖果海洋', icon: '🍭', price: 200 },
    { id: 'theme_space', name: '太空海洋', icon: '🛸', price: 300 }
  ],
  effects: [
    { id: 'effect_rainbow', name: '彩虹爆发', icon: '🌈', price: 80 },
    { id: 'effect_firework', name: '烟花庆祝', icon: '🎆', price: 100 },
    { id: 'effect_meteor', name: '流星雨', icon: '☄️', price: 120 },
    { id: 'effect_sakura', name: '樱花飘落', icon: '🌸', price: 100 },
    { id: 'effect_coins', name: '金币雨', icon: '🪙', price: 150 },
    { id: 'effect_hearts', name: '爱心爆炸', icon: '💕', price: 80 },
    { id: 'effect_lightning', name: '雷电特效', icon: '⚡', price: 120 },
    { id: 'effect_stars', name: '星星爆炸', icon: '⭐', price: 80 },
    { id: 'effect_bubbles', name: '气泡派对', icon: '🫧', price: 60 },
    { id: 'effect_snow', name: '雪花飘飘', icon: '❄️', price: 100 },
    { id: 'effect_confetti', name: '彩带飞舞', icon: '🎊', price: 90 },
    { id: 'effect_butterfly', name: '蝴蝶飞舞', icon: '🦋', price: 120 },
    { id: 'effect_fire', name: '火焰燃烧', icon: '🔥', price: 150 },
    { id: 'effect_magic', name: '魔法光环', icon: '🔮', price: 130 },
    { id: 'effect_unicorn', name: '彩虹独角兽', icon: '🦄', price: 200 }
  ],
  music: [
    { id: 'music_happy', name: '欢快海洋', icon: '🎶', price: 60 },
    { id: 'music_mystery', name: '神秘深海', icon: '🎹', price: 80 },
    { id: 'music_adventure', name: '冒险进行曲', icon: '🎺', price: 100 },
    { id: 'music_jazz', name: '轻松爵士', icon: '🎷', price: 80 },
    { id: 'music_8bit', name: '8位游戏风', icon: '🕹️', price: 120 }
  ],
  sounds: [
    { id: 'sound_dolphin', name: '海豚叫声', icon: '🐬', price: 40 },
    { id: 'sound_bubble', name: '气泡音', icon: '🫧', price: 30 },
    { id: 'sound_game', name: '游戏音效', icon: '🎮', price: 50 },
    { id: 'sound_magic', name: '魔法音效', icon: '✨', price: 60 },
    { id: 'sound_cat', name: '可爱猫咪', icon: '🐱', price: 50 }
  ],
  cardSkins: [
    { id: 'card_shell', name: '贝壳卡片', icon: '🐚', price: 100 },
    { id: 'card_chest', name: '宝箱卡片', icon: '📦', price: 120 },
    { id: 'card_star', name: '星星卡片', icon: '⭐', price: 80 },
    { id: 'card_rainbow', name: '彩虹卡片', icon: '🌈', price: 100 },
    { id: 'card_crystal', name: '水晶卡片', icon: '💎', price: 150 },
    { id: 'card_fire', name: '火焰卡片', icon: '🔥', price: 150 }
  ]
}

async function ensureFile() {
  try {
    await fs.access(SHOP_FILE)
  } catch {
    const initial = `# 商店配置

## 已解锁商品
- 多多皮肤：default
- 场景主题：default
- 答题特效：default
- 背景音乐：
- 提示音效：
- 卡片皮肤：

## 当前使用
- 多多皮肤：default
- 场景主题：default
- 答题特效：default
- 背景音乐：none
- 提示音效：none
- 卡片皮肤：default

## 现实奖励配置
| 奖励名称 | 所需积分 | 状态 |
|---------|---------|------|
| 一个冰淇淋 | 500 | 可用 |
| 看一集动画片 | 200 | 可用 |
| 买一本喜欢的书 | 1000 | 可用 |

## 兑换记录
| 日期 | 商品 | 积分 | 类型 |
|------|------|------|------|
`
    await fs.writeFile(SHOP_FILE, initial, 'utf-8')
  }
}

async function getShopData() {
  await ensureFile()
  const content = await fs.readFile(SHOP_FILE, 'utf-8')
  
  // 解析已解锁商品
  const unlockedMatch = content.match(/## 已解锁商品\n([\s\S]*?)(?=\n##)/)
  const unlocked = {
    dolphinSkins: ['default'],
    themes: ['default'],
    effects: ['default'],
    music: [],
    sounds: [],
    cardSkins: ['default']
  }
  
  if (unlockedMatch) {
    const lines = unlockedMatch[1].split('\n')
    for (const line of lines) {
      if (line.includes('多多皮肤：')) {
        const items = line.split('：')[1]?.split(',').map(s => s.trim()).filter(Boolean) || []
        unlocked.dolphinSkins = items.length ? items : ['default']
      }
      if (line.includes('场景主题：')) {
        const items = line.split('：')[1]?.split(',').map(s => s.trim()).filter(Boolean) || []
        unlocked.themes = items.length ? items : ['default']
      }
      if (line.includes('答题特效：')) {
        const items = line.split('：')[1]?.split(',').map(s => s.trim()).filter(Boolean) || []
        unlocked.effects = items.length ? items : ['default']
      }
      if (line.includes('背景音乐：')) {
        unlocked.music = line.split('：')[1]?.split(',').map(s => s.trim()).filter(Boolean) || []
      }
      if (line.includes('提示音效：')) {
        unlocked.sounds = line.split('：')[1]?.split(',').map(s => s.trim()).filter(Boolean) || []
      }
      if (line.includes('卡片皮肤：')) {
        const items = line.split('：')[1]?.split(',').map(s => s.trim()).filter(Boolean) || []
        unlocked.cardSkins = items.length ? items : ['default']
      }
    }
  }
  
  // 解析当前使用
  const currentMatch = content.match(/## 当前使用\n([\s\S]*?)(?=\n##)/)
  const current = {
    dolphinSkin: 'default',
    theme: 'default',
    effect: 'default',
    music: 'none',
    sound: 'none',
    cardSkin: 'default'
  }
  
  if (currentMatch) {
    const lines = currentMatch[1].split('\n')
    for (const line of lines) {
      if (line.includes('多多皮肤：')) current.dolphinSkin = line.split('：')[1]?.trim() || 'default'
      if (line.includes('场景主题：')) current.theme = line.split('：')[1]?.trim() || 'default'
      if (line.includes('答题特效：')) current.effect = line.split('：')[1]?.trim() || 'default'
      if (line.includes('背景音乐：')) current.music = line.split('：')[1]?.trim() || 'none'
      if (line.includes('提示音效：')) current.sound = line.split('：')[1]?.trim() || 'none'
      if (line.includes('卡片皮肤：')) current.cardSkin = line.split('：')[1]?.trim() || 'default'
    }
  }
  
  // 解析现实奖励
  const realRewards = []
  const rewardsMatch = content.match(/## 现实奖励配置\n\|[^\n]+\n\|[^\n]+\n([\s\S]*?)(?=\n##|$)/)
  if (rewardsMatch) {
    const rows = rewardsMatch[1].trim().split('\n').filter(r => r.startsWith('|'))
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean)
      if (cols.length >= 3) {
        realRewards.push({
          name: cols[0],
          price: parseInt(cols[1]) || 0,
          status: cols[2]
        })
      }
    }
  }
  
  return {
    items: SHOP_ITEMS,
    unlocked,
    current,
    realRewards
  }
}

async function purchaseItem(category, itemId, pointsService) {
  await ensureFile()
  
  // 查找商品
  const categoryItems = SHOP_ITEMS[category]
  if (!categoryItems) return { success: false, error: '商品类别不存在' }
  
  const item = categoryItems.find(i => i.id === itemId)
  if (!item) return { success: false, error: '商品不存在' }
  
  // 检查是否已拥有
  const shopData = await getShopData()
  const categoryKey = {
    dolphinSkins: 'dolphinSkins',
    themes: 'themes',
    effects: 'effects',
    music: 'music',
    sounds: 'sounds',
    cardSkins: 'cardSkins'
  }[category]
  
  if (shopData.unlocked[categoryKey]?.includes(itemId)) {
    return { success: false, error: '已拥有该商品' }
  }
  
  // 扣除积分
  const spendResult = await pointsService.spendPoints(item.price, item.name)
  if (!spendResult.success) return spendResult
  
  // 更新已解锁商品
  let content = await fs.readFile(SHOP_FILE, 'utf-8')
  
  const labelMap = {
    dolphinSkins: '多多皮肤',
    themes: '场景主题',
    effects: '答题特效',
    music: '背景音乐',
    sounds: '提示音效',
    cardSkins: '卡片皮肤'
  }
  const label = labelMap[category]
  
  // 更新已解锁列表
  const regex = new RegExp(`- ${label}：(.*)`)
  const match = content.match(regex)
  if (match) {
    const current = match[1].trim()
    const newValue = current ? `${current}, ${itemId}` : itemId
    content = content.replace(regex, `- ${label}：${newValue}`)
  }
  
  // 添加兑换记录
  const date = getTodayDateCST()
  const recordLine = `| ${date} | ${item.name} | -${item.price} | 虚拟 |`
  
  const lines = content.split('\n')
  const recordHeaderIndex = lines.findIndex(l => l.includes('| 日期 | 商品 | 积分 | 类型 |'))
  if (recordHeaderIndex >= 0) {
    lines.splice(recordHeaderIndex + 2, 0, recordLine)
  }
  
  await fs.writeFile(SHOP_FILE, lines.join('\n'), 'utf-8')
  
  return { success: true, item, remainingPoints: spendResult.availablePoints }
}

async function equipItem(category, itemId) {
  await ensureFile()
  let content = await fs.readFile(SHOP_FILE, 'utf-8')
  
  const labelMap = {
    dolphinSkin: '多多皮肤',
    theme: '场景主题',
    effect: '答题特效',
    music: '背景音乐',
    sound: '提示音效',
    cardSkin: '卡片皮肤'
  }
  const label = labelMap[category]
  if (!label) return { success: false, error: '无效类别' }
  
  // 更新当前使用部分
  const regex = new RegExp(`(## 当前使用[\\s\\S]*?- ${label}：).*`)
  content = content.replace(regex, `$1${itemId}`)
  
  await fs.writeFile(SHOP_FILE, content, 'utf-8')
  return { success: true }
}

function verifyParentPassword(password) {
  return password === PARENT_PASSWORD
}

async function addRealReward(name, price) {
  await ensureFile()
  let content = await fs.readFile(SHOP_FILE, 'utf-8')
  
  const newRow = `| ${name} | ${price} | 可用 |`
  
  // 在现实奖励表格末尾添加
  const lines = content.split('\n')
  const rewardHeaderIndex = lines.findIndex(l => l.includes('| 奖励名称 | 所需积分 | 状态 |'))
  if (rewardHeaderIndex >= 0) {
    // 找到表格结束位置
    let insertIndex = rewardHeaderIndex + 2
    while (insertIndex < lines.length && lines[insertIndex].startsWith('|')) {
      insertIndex++
    }
    lines.splice(insertIndex, 0, newRow)
  }
  
  await fs.writeFile(SHOP_FILE, lines.join('\n'), 'utf-8')
  return { success: true }
}

async function redeemRealReward(rewardName, pointsService) {
  await ensureFile()
  const shopData = await getShopData()
  
  const reward = shopData.realRewards.find(r => r.name === rewardName && r.status === '可用')
  if (!reward) return { success: false, error: '奖励不存在或不可用' }
  
  // 扣除积分
  const spendResult = await pointsService.spendPoints(reward.price, `现实奖励: ${rewardName}`)
  if (!spendResult.success) return spendResult
  
  // 添加兑换记录
  let content = await fs.readFile(SHOP_FILE, 'utf-8')
  const date = getTodayDateCST()
  const recordLine = `| ${date} | ${rewardName} | -${reward.price} | 现实 |`
  
  const lines = content.split('\n')
  const recordHeaderIndex = lines.findIndex(l => l.includes('| 日期 | 商品 | 积分 | 类型 |'))
  if (recordHeaderIndex >= 0) {
    lines.splice(recordHeaderIndex + 2, 0, recordLine)
  }
  
  await fs.writeFile(SHOP_FILE, lines.join('\n'), 'utf-8')
  
  return { success: true, reward, remainingPoints: spendResult.availablePoints }
}

module.exports = {
  SHOP_ITEMS,
  getShopData,
  purchaseItem,
  equipItem,
  verifyParentPassword,
  addRealReward,
  redeemRealReward
}
