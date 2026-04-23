<template>
  <div class="home">
    <!-- 顶部薄状态栏 -->
    <header class="topbar">
      <div class="topbar__left">
        <KittyMascot :size="44" mood="happy" />
        <div class="topbar__hello">
          <div class="hello-greeting">嗨，可可</div>
          <div class="hello-level" v-if="pointsData">{{ pointsData.levelName }}</div>
        </div>
      </div>
      <div class="topbar__stats">
        <div class="stat-pill">
          <span class="stat-pill__icon">💎</span>
          <span class="stat-pill__value">{{ pointsData?.availablePoints ?? 0 }}</span>
        </div>
        <div class="stat-pill stat-pill--rate">
          <span class="stat-pill__icon">🎯</span>
          <span class="stat-pill__value">{{ masteryRate }}%</span>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="content">
      <!-- 今日任务（最重要，第一屏首位） -->
      <DuoCard
        accent="green"
        clickable
        class="today-card"
        @click="$router.push('/cards?mode=review')"
      >
        <div class="today-card__row">
          <div class="today-card__text">
            <div class="today-card__label">今日任务</div>
            <div v-if="reviewCount > 0" class="today-card__title">
              还有 <span class="today-card__num">{{ reviewCount }}</span> 个单词
            </div>
            <div v-else class="today-card__title today-card__title--done">
              今天的任务完成啦 🎉
            </div>
          </div>
          <div class="today-card__arrow">→</div>
        </div>
        <div class="today-card__progress">
          <div class="progress-bar">
            <div
              class="progress-bar__fill"
              :style="{ width: todayProgressPct + '%' }"
            ></div>
          </div>
          <div class="progress-bar__text">{{ todayDoneCount }}/{{ todayTotal }}</div>
        </div>
        <DuoButton
          variant="primary"
          size="medium"
          block
          class="today-card__cta"
          @click.stop="$router.push('/cards?mode=review')"
        >
          {{ reviewCount > 0 ? '开始学习' : '再学一会儿' }}
        </DuoButton>
      </DuoCard>

      <!-- 周考卡片（如果有） -->
      <DuoCard
        v-if="weeklyExam && weeklyExam.total > 0"
        :accent="weeklyExam.completed ? 'yellow' : 'orange'"
        clickable
        class="exam-card"
        @click="$router.push('/weekly-exam')"
      >
        <div class="exam-card__row">
          <div class="exam-card__icon">{{ weeklyExam.completed ? '🏆' : '📝' }}</div>
          <div class="exam-card__text">
            <div class="exam-card__title">
              {{ weeklyExam.completed ? '本周考试已完成' : '本周考试' }}
            </div>
            <div class="exam-card__sub" v-if="!weeklyExam.completed">
              {{ weeklyExam.total }} 题 · 最近 {{ weeklyExam.windowWeeks }} 周单词
            </div>
            <div class="exam-card__sub" v-else>点击查看成绩</div>
          </div>
          <div class="exam-card__arrow">→</div>
        </div>
      </DuoCard>

      <!-- 单词统计三栏（紧凑） -->
      <div class="stats-row">
        <DuoCard
          accent="blue"
          clickable
          class="stat-card"
          @click="$router.push('/words?filter=unlearned')"
        >
          <div class="stat-card__value">{{ stats.unlearned }}</div>
          <div class="stat-card__label">学习中</div>
        </DuoCard>
        <DuoCard
          accent="green"
          clickable
          class="stat-card"
          @click="$router.push('/words?filter=learned')"
        >
          <div class="stat-card__value">{{ stats.learned }}</div>
          <div class="stat-card__label">已掌握</div>
        </DuoCard>
        <DuoCard
          accent="purple"
          class="stat-card"
        >
          <div class="stat-card__value">{{ stats.total }}</div>
          <div class="stat-card__label">总词汇</div>
        </DuoCard>
      </div>

      <!-- 底部入口 -->
      <div class="quick-actions">
        <DuoButton
          variant="secondary"
          size="large"
          block
          icon="📜"
          @click="$router.push('/words')"
        >
          单词本
        </DuoButton>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { wordsApi } from '../api/words'
import { getReviewStats } from '../api/review'
import { pointsApi } from '../api/points'
import { weeklyExamApi } from '../api/weeklyExam'
import KittyMascot from '../components/duo/KittyMascot.vue'
import DuoCard from '../components/duo/DuoCard.vue'
import DuoButton from '../components/duo/DuoButton.vue'

const stats = ref({ total: 0, unlearned: 0, learned: 0 })
const reviewCount = ref(0)
const todayTotal = ref(0)
const pointsData = ref(null)
const weeklyExam = ref(null)

const masteryRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.learned / stats.value.total) * 100)
})

const todayDoneCount = computed(() =>
  Math.max(0, todayTotal.value - reviewCount.value)
)
const todayProgressPct = computed(() => {
  if (todayTotal.value === 0) return reviewCount.value === 0 ? 100 : 0
  return Math.round((todayDoneCount.value / todayTotal.value) * 100)
})

onMounted(async () => {
  try {
    const res = await wordsApi.getStats()
    stats.value = res.data.data || res.data
  } catch (e) { console.error('获取统计失败:', e) }

  try {
    const reviewRes = await getReviewStats()
    if (reviewRes.success) {
      const remaining = reviewRes.data.todayRemaining ?? 0
      const reviewed  = reviewRes.data.todayReviewed  ?? 0
      reviewCount.value = remaining
      todayTotal.value  = remaining + reviewed
    }
  } catch (e) { console.error('获取复习统计失败:', e) }

  try {
    const pointsResult = await pointsApi.getPoints()
    if (pointsResult.success) pointsData.value = pointsResult.data
  } catch (e) { console.error('获取积分数据失败:', e) }

  try {
    const examRes = await weeklyExamApi.getCurrent()
    const examData = examRes.data?.data || examRes.data
    if (examData && examData.total > 0) weeklyExam.value = examData
  } catch (e) { console.error('获取周考数据失败:', e) }
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: transparent;
  font-family: var(--duo-font-body);
  color: var(--duo-text);
}

/* === 顶部状态栏 === */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 248, 231, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 2px solid var(--duo-border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.topbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.topbar__hello {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.hello-greeting {
  font-size: 16px;
  font-weight: 800;
  color: var(--duo-text);
}
.hello-level {
  font-size: 11px;
  color: var(--duo-text-muted);
  font-weight: 600;
}

.topbar__stats {
  display: flex;
  gap: 8px;
}
.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--duo-bg-soft);
  border: 2px solid var(--duo-border);
  border-radius: var(--duo-radius-full);
  padding: 4px 12px;
  font-weight: 800;
  font-size: 14px;
  color: var(--duo-text);
}
.stat-pill__icon { font-size: 14px; }
.stat-pill--rate { color: var(--duo-green-dark); }

/* === 主内容 === */
.content {
  padding: 16px;
  padding-bottom: 120px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 560px;
  margin: 0 auto;
}

/* === 今日任务大卡 === */
.today-card { padding: 20px; }
.today-card__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.today-card__text { flex: 1; }
.today-card__label {
  font-size: 12px;
  color: var(--duo-text-muted);
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.today-card__title {
  font-size: 22px;
  font-weight: 900;
  color: var(--duo-text);
  margin-top: 4px;
  line-height: 1.3;
}
.today-card__num {
  color: var(--duo-green-dark);
  font-size: 28px;
}
.today-card__title--done { color: var(--duo-green-dark); }
.today-card__arrow {
  color: var(--duo-text-muted);
  font-size: 20px;
  font-weight: 800;
  margin-top: 8px;
}
.today-card__progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.progress-bar {
  flex: 1;
  height: 14px;
  background: var(--duo-bg-soft);
  border: 2px solid var(--duo-border);
  border-radius: var(--duo-radius-full);
  overflow: hidden;
}
.progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--duo-green-light), var(--duo-green));
  border-radius: var(--duo-radius-full);
  transition: width 400ms ease;
}
.progress-bar__text {
  font-size: 12px;
  font-weight: 800;
  color: var(--duo-text-soft);
  min-width: 48px;
  text-align: right;
}
.today-card__cta { margin-top: 16px; }

/* === 周考卡片 === */
.exam-card { padding: 16px 20px; }
.exam-card__row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.exam-card__icon { font-size: 36px; line-height: 1; }
.exam-card__text { flex: 1; }
.exam-card__title {
  font-size: 16px;
  font-weight: 800;
  color: var(--duo-text);
}
.exam-card__sub {
  font-size: 13px;
  color: var(--duo-text-muted);
  margin-top: 2px;
}
.exam-card__arrow {
  color: var(--duo-text-muted);
  font-size: 20px;
  font-weight: 800;
}

/* === 三栏统计 === */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.stat-card {
  padding: 14px 8px;
  text-align: center;
}
.stat-card__value {
  font-size: 26px;
  font-weight: 900;
  color: var(--duo-text);
  line-height: 1;
}
.stat-card__label {
  font-size: 12px;
  color: var(--duo-text-muted);
  margin-top: 6px;
  font-weight: 700;
}

.quick-actions { margin-top: 8px; }

@media (max-width: 380px) {
  .stat-card__value { font-size: 22px; }
  .today-card__title { font-size: 19px; }
  .today-card__num { font-size: 24px; }
}
</style>
