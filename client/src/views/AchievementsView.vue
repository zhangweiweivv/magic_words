<template>
  <div class="achievements">
    <BubbleBackground :count="6" />
    <WaveDecoration position="bottom" />
    
    <div class="achievements-content">
      <!-- 头部 -->
      <div class="header">
        <h1 class="page-title">🏆 成就墙</h1>
        <div class="progress-badge">
          <span class="progress-icon">⭐</span>
          <span class="progress-text">{{ unlockedCount }} / {{ totalCount }}</span>
        </div>
      </div>
      
      <!-- 进度条 -->
      <div class="overall-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-label">已解锁 {{ progressPercent }}% 的成就</div>
      </div>
      
      <!-- 按类别分组的成就列表 -->
      <div v-for="category in categories" :key="category.name" class="category-section">
        <div class="category-header">
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
          <span class="category-count">{{ category.unlocked }}/{{ category.total }}</span>
        </div>
        
        <div class="achievements-grid">
          <div 
            v-for="achievement in category.achievements" 
            :key="achievement.id"
            class="achievement-card"
            :class="{ unlocked: achievement.unlocked, locked: !achievement.unlocked }"
          >
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-info">
              <div class="achievement-name">{{ achievement.name }}</div>
              <div class="achievement-condition">{{ achievement.condition }}</div>
              <div v-if="achievement.unlocked" class="achievement-date">
                ✓ {{ achievement.unlockedAt }}
              </div>
            </div>
            <div v-if="achievement.unlocked" class="achievement-check">✅</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { achievementsApi } from '../api/achievements'
import BubbleBackground from '../components/ocean/BubbleBackground.vue'
import WaveDecoration from '../components/ocean/WaveDecoration.vue'

const achievements = ref([])
const unlockedCount = ref(0)
const totalCount = ref(0)

const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((unlockedCount.value / totalCount.value) * 100)
})

// 类别图标映射
const categoryIcons = {
  '入门': '⛵',
  '坚持': '🚣',
  '数量': '📚',
  '完美': '💯',
  '积分': '💰',
  '收藏': '🛍️'
}

// 按类别分组
const categories = computed(() => {
  const grouped = {}
  
  for (const a of achievements.value) {
    if (!grouped[a.category]) {
      grouped[a.category] = {
        name: a.category,
        icon: categoryIcons[a.category] || '🏅',
        achievements: [],
        unlocked: 0,
        total: 0
      }
    }
    grouped[a.category].achievements.push(a)
    grouped[a.category].total++
    if (a.unlocked) grouped[a.category].unlocked++
  }
  
  // 按固定顺序返回
  const order = ['入门', '坚持', '数量', '完美', '积分', '收藏']
  return order.map(name => grouped[name]).filter(Boolean)
})

onMounted(async () => {
  try {
    const res = await achievementsApi.getAchievements()
    const data = res.data || res
    achievements.value = data.achievements || []
    unlockedCount.value = data.unlockedCount || 0
    totalCount.value = data.totalCount || 0
  } catch (e) {
    console.error('获取成就失败:', e)
  }
})
</script>

<style scoped>
.achievements {
  min-height: 100vh;
  background: var(--bg-gradient, var(--gradient-ocean));
  position: relative;
  overflow: hidden;
}

.achievements-content {
  position: relative;
  z-index: 2;
  padding: 20px;
  padding-bottom: 180px;
  max-width: 600px;
  margin: 0 auto;
}

/* 头部 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  color: var(--pearl);
  font-family: var(--font-display);
  font-size: 28px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(30, 58, 95, 0.3);
}

.progress-badge {
  background: var(--foam);
  border-radius: var(--radius-full);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: var(--shadow-sm);
}

.progress-icon {
  font-size: 18px;
}

.progress-text {
  font-weight: bold;
  color: var(--ocean-deep);
  font-family: var(--font-display);
}

/* 总进度条 */
.overall-progress {
  background: var(--foam);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-md);
}

.progress-bar {
  height: 12px;
  background: var(--ocean-pale);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ocean-light) 0%, var(--starfish) 100%);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.progress-label {
  text-align: center;
  color: var(--ocean-medium);
  font-size: 14px;
}

/* 类别区域 */
.category-section {
  margin-bottom: 24px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-md);
}

.category-icon {
  font-size: 24px;
}

.category-name {
  flex: 1;
  font-size: 18px;
  font-weight: bold;
  color: var(--pearl);
  font-family: var(--font-display);
}

.category-count {
  background: var(--foam);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: bold;
  color: var(--ocean-deep);
}

/* 成就网格 */
.achievements-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 成就卡片 */
.achievement-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  gap: 14px;
}

.achievement-card.unlocked {
  background: var(--foam);
  box-shadow: var(--shadow-md);
  border-left: 4px solid var(--starfish);
}

.achievement-card.unlocked:hover {
  transform: translateX(5px);
  box-shadow: var(--shadow-lg);
}

.achievement-card.locked {
  background: rgba(255, 255, 255, 0.15);
  opacity: 0.7;
}

.achievement-icon {
  font-size: 36px;
  line-height: 1;
  min-width: 44px;
  text-align: center;
}

.achievement-card.locked .achievement-icon {
  filter: grayscale(80%);
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--ocean-deep);
  font-family: var(--font-display);
  margin-bottom: 2px;
}

.achievement-card.locked .achievement-name {
  color: var(--ocean-medium);
}

.achievement-condition {
  font-size: 13px;
  color: var(--ocean-medium);
}

.achievement-date {
  font-size: 12px;
  color: var(--coral);
  margin-top: 4px;
  font-weight: 500;
}

.achievement-check {
  font-size: 24px;
  animation: pop-in 0.3s ease;
}

@keyframes pop-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* 响应式 */
@media (max-width: 480px) {
  .page-title {
    font-size: 22px;
  }
  
  .achievement-icon {
    font-size: 28px;
    min-width: 36px;
  }
  
  .achievement-name {
    font-size: 14px;
  }
  
  .achievement-condition {
    font-size: 12px;
  }
}
</style>
