<template>
  <div class="report">
    <BubbleBackground :count="10" />
    <WaveDecoration position="bottom" />
    
    <div class="report-content">
      <h1 class="page-title">
        <span class="title-icon">📊</span>
        学习报告
      </h1>

      <!-- 统计卡片行 -->
      <div class="stats-row">
        <div class="stat-card today">
          <div class="stat-icon">🌟</div>
          <div class="stat-value">{{ stats.todayWords }}</div>
          <div class="stat-label">今日学习</div>
        </div>
        <div class="stat-card week">
          <div class="stat-icon">📅</div>
          <div class="stat-value">{{ stats.weekWords }}</div>
          <div class="stat-label">本周学习</div>
        </div>
        <div class="stat-card month">
          <div class="stat-icon">🗓️</div>
          <div class="stat-value">{{ stats.monthWords }}</div>
          <div class="stat-label">本月学习</div>
        </div>
      </div>

      <!-- 连续学习天数 -->
      <div class="streak-card">
        <div class="streak-flames">
          <span v-for="i in Math.min(stats.streakDays, 7)" :key="i" class="flame" :style="{ animationDelay: `${i * 0.1}s` }">🔥</span>
        </div>
        <div class="streak-info">
          <div class="streak-value">{{ stats.streakDays }}</div>
          <div class="streak-label">连续学习天数</div>
        </div>
        <div class="streak-message">{{ streakMessage }}</div>
      </div>

      <!-- 掌握进度条 -->
      <div class="progress-card">
        <div class="progress-header">
          <span class="progress-title">🎯 掌握进度</span>
          <span class="progress-percent">{{ masteryPercent }}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: `${masteryPercent}%` }">
            <span class="swimming-fish" :style="{ left: `${Math.min(masteryPercent, 95)}%` }">🐠</span>
          </div>
          <div class="progress-markers">
            <span class="marker" style="left: 25%">25%</span>
            <span class="marker" style="left: 50%">50%</span>
            <span class="marker" style="left: 75%">75%</span>
          </div>
        </div>
        <div class="progress-stats">
          <span>已掌握 <strong>{{ wordStats.learned }}</strong> / {{ wordStats.total }} 个单词</span>
        </div>
      </div>

      <!-- PET词库扩充 -->
      <div class="expansion-card" v-if="expansion">
        <div class="expansion-header">
          <span class="expansion-title">📚 PET词库扩充</span>
          <span class="expansion-percent">{{ Math.round((expansion.totalAdded / expansion.totalAvailable) * 100) }}%</span>
        </div>

        <!-- 总进度条 -->
        <div class="expansion-progress-wrap">
          <div class="expansion-bar-bg">
            <div class="expansion-bar-fill" :style="{ width: `${(expansion.totalAdded / expansion.totalAvailable) * 100}%` }"></div>
          </div>
          <div class="expansion-bar-label">已扩充 {{ expansion.totalAdded }} / {{ expansion.totalAvailable }} 词</div>
        </div>

        <!-- 分级进度 -->
        <div class="level-progress-list">
          <div class="level-progress-item">
            <span class="level-tag a1">A1</span>
            <div class="level-bar-bg">
              <div class="level-bar-fill a1" :style="{ width: `${(expansion.progress.A1 / 861) * 100}%` }"></div>
            </div>
            <span class="level-count">{{ expansion.progress.A1 }}/861</span>
          </div>
          <div class="level-progress-item">
            <span class="level-tag a2">A2</span>
            <div class="level-bar-bg">
              <div class="level-bar-fill a2" :style="{ width: `${(expansion.progress.A2 / 852) * 100}%` }"></div>
            </div>
            <span class="level-count">{{ expansion.progress.A2 }}/852</span>
          </div>
          <div class="level-progress-item">
            <span class="level-tag b1">B1</span>
            <div class="level-bar-bg">
              <div class="level-bar-fill b1" :style="{ width: `${(expansion.progress.B1 / 850) * 100}%` }"></div>
            </div>
            <span class="level-count">{{ expansion.progress.B1 }}/850</span>
          </div>
        </div>

        <!-- 扩充信息 -->
        <div class="expansion-info">
          <div class="info-row">
            <span class="info-label">📅 上次扩充</span>
            <span class="info-value">{{ expansion.lastExpansion }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">⏭️ 下次扩充</span>
            <span class="info-value">{{ expansion.nextExpansion }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">📦 每批扩充</span>
            <span class="info-value">{{ expansion.config.batchSize }} 词（A1×{{ Math.round(expansion.config.batchSize * expansion.config.ratio.A1) }} + A2×{{ Math.round(expansion.config.batchSize * expansion.config.ratio.A2) }} + B1×{{ Math.round(expansion.config.batchSize * expansion.config.ratio.B1) }}）</span>
          </div>
        </div>

        <!-- 手动扩充按钮 -->
        <div class="expansion-action">
          <button 
            class="expand-btn" 
            @click="handleExpand" 
            :disabled="expanding"
          >
            <span v-if="expanding" class="btn-loading">⏳</span>
            <span v-else class="btn-icon">🚀</span>
            <span>{{ expanding ? '正在扩充...' : '手动扩充新词' }}</span>
          </button>
          <div v-if="expandResult" class="expand-result" :class="expandResult.expanded ? 'success' : 'info'">
            {{ expandResult.message }}
            <span v-if="expandResult.wordsAdded">（+{{ expandResult.wordsAdded }} 词）</span>
          </div>
        </div>
      </div>

      <!-- 最近获得的成就 -->
      <div class="achievements-section">
        <h2 class="section-title">
          <span class="section-icon">🏆</span>
          最近成就
        </h2>
        <div class="achievements-list" v-if="recentAchievements.length > 0">
          <div 
            v-for="achievement in recentAchievements" 
            :key="achievement.id" 
            class="achievement-item"
          >
            <span class="achievement-icon">{{ achievement.icon }}</span>
            <div class="achievement-info">
              <div class="achievement-name">{{ achievement.name }}</div>
              <div class="achievement-desc">{{ achievement.description }}</div>
            </div>
            <span class="achievement-check">✓</span>
          </div>
        </div>
        <div v-else class="no-achievements">
          <span class="empty-icon">🎁</span>
          <p>继续加油，成就在等着你！</p>
        </div>
      </div>

      <!-- 家长入口 -->
      <div class="parent-entry">
        <button class="parent-btn" @click="$router.push('/parent')">
          <span class="btn-icon">👨‍👩‍👧</span>
          <span class="btn-text">家长中心</span>
          <span class="btn-arrow">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BubbleBackground from '../components/ocean/BubbleBackground.vue'
import WaveDecoration from '../components/ocean/WaveDecoration.vue'
import { statsApi } from '../api/stats'
import { achievementsApi } from '../api/achievements'
import { wordsApi } from '../api/words'
import { expansionApi } from '../api/expansion'

const stats = ref({
  todayWords: 0,
  weekWords: 0,
  monthWords: 0,
  streakDays: 0
})

const wordStats = ref({
  total: 0,
  learned: 0,
  unlearned: 0
})

const recentAchievements = ref([])

const expansion = ref(null)
const expanding = ref(false)
const expandResult = ref(null)

const masteryPercent = computed(() => {
  if (wordStats.value.total === 0) return 0
  return Math.round((wordStats.value.learned / wordStats.value.total) * 100)
})

const streakMessage = computed(() => {
  const days = stats.value.streakDays
  if (days === 0) return '今天开始你的学习之旅吧！'
  if (days < 3) return '很棒！坚持下去！'
  if (days < 7) return '太厉害了！继续保持！'
  if (days < 14) return '你是学习小达人！🌟'
  if (days < 30) return '坚持两周了！非常棒！💪'
  return '哇！学习超级明星！🏆'
})

async function handleExpand() {
  expanding.value = true
  expandResult.value = null
  try {
    const res = await expansionApi.expand(true)
    if (res && res.data) {
      expandResult.value = res.data
      // Refresh expansion status
      const expRes = await expansionApi.getStatus()
      if (expRes && expRes.data) {
        expansion.value = expRes.data
      }
    }
  } catch (e) {
    console.error('扩充失败:', e)
    expandResult.value = { expanded: false, message: '扩充失败: ' + (e.response?.data?.error || e.message) }
  } finally {
    expanding.value = false
  }
}

onMounted(async () => {
  // 获取统计摘要
  try {
    const summary = await statsApi.getSummary()
    if (summary) {
      stats.value = {
        todayWords: summary.todayWords || 0,
        weekWords: summary.weekWords || 0,
        monthWords: summary.monthWords || 0,
        streakDays: summary.streakDays || 0
      }
    }
  } catch (e) {
    console.error('获取统计摘要失败:', e)
  }

  // 获取单词统计
  try {
    const res = await wordsApi.getStats()
    const data = res.data?.data || res.data
    if (data) {
      wordStats.value = {
        total: data.total || 0,
        learned: data.learned || 0,
        unlearned: data.unlearned || 0
      }
    }
  } catch (e) {
    console.error('获取单词统计失败:', e)
  }

  // 获取扩展状态
  try {
    const expRes = await expansionApi.getStatus()
    if (expRes && expRes.data) {
      expansion.value = expRes.data
    }
  } catch (e) {
    console.error('获取扩展状态失败:', e)
  }

  // 获取成就
  try {
    const achData = await achievementsApi.getAchievements()
    const achList = achData?.achievements || achData
    if (achList && Array.isArray(achList)) {
      // 筛选已解锁的成就，取最近5个
      recentAchievements.value = achList
        .filter(a => a.unlocked)
        .slice(0, 5)
    }
  } catch (e) {
    console.error('获取成就失败:', e)
  }
})
</script>

<style scoped>
.report {
  min-height: 100vh;
  background: var(--bg-gradient, var(--gradient-ocean));
  position: relative;
  overflow: hidden;
}

.report-content {
  position: relative;
  z-index: 2;
  padding: 20px;
  padding-bottom: 180px;
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  text-align: center;
  color: var(--pearl);
  font-family: var(--font-display);
  font-size: 28px;
  margin: 20px 0 30px;
  text-shadow: 2px 2px 4px rgba(30, 58, 95, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.title-icon {
  font-size: 32px;
}

/* 统计卡片行 */
.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: var(--foam);
  border-radius: var(--radius-lg);
  padding: 16px 12px;
  text-align: center;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.stat-card.today {
  border-top: 4px solid var(--starfish);
}

.stat-card.week {
  border-top: 4px solid var(--ocean-light);
}

.stat-card.month {
  border-top: 4px solid var(--coral);
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: var(--ocean-deep);
  font-family: var(--font-display);
}

.stat-label {
  font-size: 12px;
  color: var(--ocean-medium);
  margin-top: 4px;
}

/* 连续学习天数 */
.streak-card {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
  border-radius: var(--radius-lg);
  padding: 24px;
  text-align: center;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.streak-flames {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 12px;
}

.flame {
  font-size: 28px;
  animation: flame-dance 0.5s ease-in-out infinite alternate;
}

@keyframes flame-dance {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(-5px) scale(1.1); }
}

.streak-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.streak-value {
  font-size: 56px;
  font-weight: bold;
  color: white;
  font-family: var(--font-display);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  line-height: 1;
}

.streak-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 4px;
}

.streak-message {
  margin-top: 12px;
  color: white;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
}

/* 掌握进度条 */
.progress-card {
  background: var(--foam);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--ocean-deep);
}

.progress-percent {
  font-size: 24px;
  font-weight: bold;
  color: var(--ocean-medium);
  font-family: var(--font-display);
}

.progress-bar-container {
  position: relative;
  height: 24px;
  background: var(--ocean-pale);
  border-radius: 12px;
  overflow: visible;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--ocean-light) 0%, var(--ocean-medium) 100%);
  border-radius: 12px;
  transition: width 1s ease-out;
  position: relative;
}

.swimming-fish {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  animation: swim 1s ease-in-out infinite;
  z-index: 5;
}

@keyframes swim {
  0%, 100% { transform: translateY(-50%) rotate(0deg); }
  25% { transform: translateY(-60%) rotate(-10deg); }
  75% { transform: translateY(-40%) rotate(10deg); }
}

.progress-markers {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
}

.marker {
  position: absolute;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--ocean-medium);
}

.progress-stats {
  margin-top: 20px;
  text-align: center;
  color: var(--ocean-medium);
  font-size: 14px;
}

.progress-stats strong {
  color: var(--ocean-deep);
  font-size: 18px;
}

/* PET词库扩充卡片 */
.expansion-card {
  background: var(--foam);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
}

.expansion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.expansion-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--ocean-deep);
}

.expansion-percent {
  font-size: 24px;
  font-weight: bold;
  color: var(--ocean-medium);
  font-family: var(--font-display);
}

.expansion-progress-wrap {
  margin-bottom: 16px;
}

.expansion-bar-bg {
  height: 20px;
  background: var(--ocean-pale);
  border-radius: 10px;
  overflow: hidden;
}

.expansion-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ocean-light) 0%, var(--coral) 100%);
  border-radius: 10px;
  transition: width 1s ease-out;
  min-width: 2px;
}

.expansion-bar-label {
  text-align: center;
  font-size: 13px;
  color: var(--ocean-medium);
  margin-top: 6px;
}

.level-progress-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.level-progress-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.level-tag {
  width: 32px;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 0;
  border-radius: 6px;
  color: white;
  flex-shrink: 0;
}

.level-tag.a1 {
  background: var(--ocean-light);
}

.level-tag.a2 {
  background: var(--ocean-medium);
}

.level-tag.b1 {
  background: var(--ocean-deep);
}

.level-bar-bg {
  flex: 1;
  height: 12px;
  background: var(--ocean-pale);
  border-radius: 6px;
  overflow: hidden;
}

.level-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 1s ease-out;
  min-width: 2px;
}

.level-bar-fill.a1 {
  background: var(--ocean-light);
}

.level-bar-fill.a2 {
  background: var(--ocean-medium);
}

.level-bar-fill.b1 {
  background: var(--ocean-deep);
}

.level-count {
  font-size: 12px;
  color: var(--ocean-medium);
  width: 60px;
  text-align: right;
  flex-shrink: 0;
}

.expansion-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--ocean-pale);
}

.expansion-action {
  margin-top: 16px;
  text-align: center;
}

.expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, var(--ocean-light) 0%, var(--ocean-medium) 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: 0 2px 8px rgba(0, 120, 180, 0.3);
}

.expand-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 120, 180, 0.4);
}

.expand-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.expand-btn .btn-icon,
.expand-btn .btn-loading {
  font-size: 18px;
}

.expand-result {
  margin-top: 10px;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  display: inline-block;
}

.expand-result.success {
  background: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
}

.expand-result.info {
  background: rgba(33, 150, 243, 0.15);
  color: #1565c0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.info-label {
  color: var(--ocean-medium);
}

.info-value {
  color: var(--ocean-deep);
  font-weight: 500;
}

/* 成就部分 */
.achievements-section {
  background: var(--foam);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: var(--ocean-deep);
  margin: 0 0 16px 0;
  font-family: var(--font-display);
}

.section-icon {
  font-size: 24px;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--starfish);
}

.achievement-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-weight: bold;
  color: var(--ocean-deep);
  font-size: 14px;
}

.achievement-desc {
  font-size: 12px;
  color: var(--ocean-medium);
  margin-top: 2px;
}

.achievement-check {
  width: 24px;
  height: 24px;
  background: var(--starfish);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.no-achievements {
  text-align: center;
  padding: 20px;
  color: var(--ocean-medium);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

/* 家长入口 */
.parent-entry {
  margin-top: 30px;
}

.parent-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  background: var(--foam);
  border: 2px dashed var(--ocean-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  font-size: 16px;
  color: var(--ocean-deep);
}

.parent-btn:hover {
  background: var(--ocean-pale);
  border-color: var(--ocean-medium);
  transform: scale(1.02);
}

.btn-icon {
  font-size: 24px;
}

.btn-text {
  font-weight: bold;
}

.btn-arrow {
  font-size: 20px;
  transition: transform var(--transition-normal);
}

.parent-btn:hover .btn-arrow {
  transform: translateX(5px);
}

/* 响应式 */
@media (max-width: 480px) {
  .stats-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .stat-card {
    flex-direction: row;
    justify-content: flex-start;
    gap: 16px;
    padding: 16px;
  }
  
  .stat-icon {
    margin-bottom: 0;
  }
  
  .stat-value {
    font-size: 28px;
  }
  
  .streak-value {
    font-size: 48px;
  }
  
  .page-title {
    font-size: 24px;
  }
}
</style>
