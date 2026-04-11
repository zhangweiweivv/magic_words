<template>
  <div class="progress-page">
    <header class="progress-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h1>📚 我的进度</h1>
    </header>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <!-- Overall stats card -->
      <section class="overall-stats" data-test="overall-stats">
        <h2>总览</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ overall.total }}</span>
            <span class="stat-label">总篇数</span>
          </div>
          <div class="stat-item stat-graduated">
            <span class="stat-value">{{ overall.graduated }}</span>
            <span class="stat-label">已掌握 ✅</span>
          </div>
          <div class="stat-item stat-active">
            <span class="stat-value">{{ overall.active }}</span>
            <span class="stat-label">学习中 📖</span>
          </div>
          <div class="stat-item stat-not-started">
            <span class="stat-value">{{ overall.not_started }}</span>
            <span class="stat-label">未开始</span>
          </div>
        </div>
        <div class="progress-bar-container" v-if="overall.total > 0">
          <div class="progress-bar">
            <div class="progress-fill graduated" :style="{ width: graduatedPct + '%' }"></div>
            <div class="progress-fill active" :style="{ width: activePct + '%' }"></div>
          </div>
          <span class="progress-pct">{{ graduatedPct }}% 已掌握</span>
        </div>
      </section>

      <!-- Per-collection accordion -->
      <section class="collections-section">
        <div
          v-for="col in collections"
          :key="col.name"
          class="collection-group"
          data-test="collection-group"
        >
          <div class="collection-header" @click="toggleCollection(col.name)">
            <h3>
              <span class="toggle-icon">{{ expanded[col.name] ? '▼' : '▶' }}</span>
              {{ col.name }}
            </h3>
            <div class="collection-stats-inline">
              <span class="stat-tag graduated">✅ {{ col.stats.graduated }}</span>
              <span class="stat-tag active">📖 {{ col.stats.active }}</span>
              <span class="stat-tag not-started">⬜ {{ col.stats.not_started }}</span>
            </div>
          </div>
          <ul v-if="expanded[col.name]" class="article-list">
            <li
              v-for="article in col.articles"
              :key="article.articleId"
              class="article-row"
              :class="'status-' + article.status"
              data-test="article-row"
              @click="goToArticle(article)"
            >
              <span class="article-title">{{ article.title }}</span>
              <span class="article-status">
                <template v-if="article.status === 'graduated'">✅ 已掌握</template>
                <template v-else-if="article.status === 'active'">
                  📖 第{{ article.currentStage }}轮
                </template>
                <template v-else>⬜ 未开始</template>
              </span>
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { fetchProgressOverview } from '../api/index.js'

const router = useRouter()
const loading = ref(true)
const error = ref(null)
const overall = ref({ total: 0, active: 0, graduated: 0, not_started: 0 })
const collections = ref([])
const expanded = reactive({})

const graduatedPct = computed(() => {
  if (!overall.value.total) return 0
  return Math.round((overall.value.graduated / overall.value.total) * 100)
})

const activePct = computed(() => {
  if (!overall.value.total) return 0
  return Math.round((overall.value.active / overall.value.total) * 100)
})

function toggleCollection(name) {
  expanded[name] = !expanded[name]
}

function goToArticle(article) {
  if (article.status !== 'not_started') {
    router.push({ name: 'article', params: { articleId: article.articleId } })
  }
}

async function loadData() {
  try {
    const data = await fetchProgressOverview()
    overall.value = data.overall
    collections.value = data.collections
    // Auto-expand first collection
    if (data.collections.length > 0) {
      expanded[data.collections[0].name] = true
    }
  } catch (e) {
    error.value = '加载失败：' + e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.progress-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.progress-header {
  text-align: center;
  padding: 1rem 0;
  border-bottom: 2px solid var(--border-subtle, #e0d5c1);
  margin-bottom: 1.5rem;
  position: relative;
}

.progress-header h1 {
  font-size: 1.5rem;
  color: var(--ink-black, #2c3e50);
}

.back-link {
  position: absolute;
  left: 0;
  top: 1.2rem;
  color: var(--accent-red, #c0392b);
  text-decoration: none;
  font-size: 0.9rem;
}

.overall-stats {
  background: var(--paper-white, #fff);
  border: 1px solid var(--border-subtle, #e0d5c1);
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.5rem;
}

.overall-stats h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--ink-black, #2c3e50);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  text-align: center;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--ink-black, #2c3e50);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--ink-light, #888);
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
}

.progress-fill.graduated {
  background: #27ae60;
}

.progress-fill.active {
  background: #f39c12;
}

.progress-pct {
  font-size: 0.8rem;
  color: var(--ink-light, #888);
  white-space: nowrap;
}

.collection-group {
  margin-bottom: 0.5rem;
  border: 1px solid var(--border-subtle, #e0d5c1);
  border-radius: 8px;
  overflow: hidden;
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  cursor: pointer;
  background: var(--paper-white, #fff);
}

.collection-header:hover {
  background: var(--paper-light, #faf5eb);
}

.collection-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--ink-black, #2c3e50);
}

.toggle-icon {
  font-size: 0.7rem;
  margin-right: 0.3rem;
}

.collection-stats-inline {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.stat-tag {
  white-space: nowrap;
}

.article-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.article-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  border-top: 1px solid var(--border-subtle, #e0d5c1);
  cursor: pointer;
  transition: background 0.15s;
}

.article-row:hover {
  background: var(--paper-light, #faf5eb);
}

.article-row.status-not_started {
  opacity: 0.6;
  cursor: default;
}

.article-title {
  font-size: 0.95rem;
  color: var(--ink-black, #2c3e50);
}

.article-status {
  font-size: 0.8rem;
  white-space: nowrap;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
  color: var(--ink-light, #888);
}

.error {
  color: #c0392b;
}
</style>
