<template>
  <div class="detail-view">
    <PlumRainCanvas />
    <header class="detail-header">
      <button class="back-btn" @click="router.back()">← 返回</button>
      <h1>{{ state?.title || articleId }} — 学习记录</h1>
    </header>

    <section v-if="state" class="schedule-info">
      <h2>📅 复习计划</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">状态</span>
          <span class="value" :class="state.status">{{ statusText }}</span>
        </div>
        <div class="info-item">
          <span class="label">当前轮次</span>
          <span class="value">{{ state.currentStage }} / {{ state.totalStages }}</span>
        </div>
        <div class="info-item">
          <span class="label">下次复习</span>
          <span class="value">{{ state.nextDueDate || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="label">复习间隔</span>
          <span class="value">{{ state.intervals?.join(', ') || '—' }} 天</span>
        </div>
      </div>
    </section>

    <section v-if="events.length" class="timeline">
      <h2>📝 学习轨迹</h2>
      <ul class="event-list">
        <li v-for="(evt, i) in events" :key="i" class="event-item">
          <span class="event-time">{{ formatTime(evt.timestamp) }}</span>
          <span class="event-type">{{ evt.type }}</span>
          <span v-if="evt.detail" class="event-detail">{{ evt.detail }}</span>
        </li>
      </ul>
    </section>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchArticleState } from '../api/index.js'
import PlumRainCanvas from '../components/PlumRainCanvas.vue'

const route = useRoute()
const router = useRouter()
const articleId = route.params.articleId

const state = ref(null)
const events = ref([])
const loading = ref(true)
const error = ref('')

const statusText = computed(() => {
  const map = { active: '学习中', graduated: '已毕业', deferred: '已推迟' }
  return map[state.value?.status] || state.value?.status || '—'
})

function formatTime(ts) {
  if (!ts) return ''
  return ts.slice(0, 16).replace('T', ' ')
}

async function loadData() {
  try {
    const data = await fetchArticleState(articleId)
    state.value = data.state
    events.value = data.events || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.detail-header {
  padding: 1.5rem 0 1rem;
  border-bottom: 2px solid var(--border-subtle);
  margin-bottom: 1.5rem;
}

.back-btn {
  background: none;
  border: none;
  color: var(--accent-red);
  cursor: pointer;
  font-size: 0.95rem;
  font-family: inherit;
  margin-bottom: 0.5rem;
}

.detail-header h1 {
  font-size: 1.4rem;
  color: var(--ink-black);
}

.schedule-info h2, .timeline h2 {
  font-size: 1.1rem;
  color: var(--accent-red);
  margin-bottom: 0.8rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--border-subtle);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.info-item {
  padding: 0.6rem 0.8rem;
  background: var(--paper-white);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
}

.info-item .label {
  display: block;
  font-size: 0.8rem;
  color: var(--ink-light);
  margin-bottom: 0.2rem;
}

.info-item .value {
  font-size: 0.95rem;
  font-weight: 600;
}

.info-item .value.active { color: var(--accent-gold); }
.info-item .value.graduated { color: var(--success-green); }

.timeline {
  margin-bottom: 2rem;
}

.event-list {
  list-style: none;
  padding: 0;
}

.event-item {
  display: flex;
  gap: 0.8rem;
  padding: 0.6rem 0;
  border-bottom: 1px dashed var(--border-subtle);
  font-size: 0.9rem;
}

.event-time {
  color: var(--ink-light);
  white-space: nowrap;
}

.event-type {
  font-weight: 600;
  color: var(--ink-dark);
}

.event-detail {
  color: var(--ink-light);
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.error { color: var(--accent-red-light); }
</style>
