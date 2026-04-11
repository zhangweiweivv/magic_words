<template>
  <div class="home">
    <header class="home-header">
      <h1>📜 可可古诗文</h1>
      <p class="collection-name" v-if="collectionName">当前集：{{ collectionName }}</p>
    </header>

    <section class="due-section">
      <h2>📖 今日待复习</h2>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="dueList.length === 0" class="empty">今天没有待复习的内容 🎉</div>
      <ul v-else class="due-list">
        <li
          v-for="item in dueList"
          :key="item.articleId"
          class="due-item"
          @click="goToArticle(item.articleId)"
        >
          <span class="due-title">{{ item.title }}</span>
          <span class="due-stage">第{{ item.currentStage }}轮</span>
        </li>
      </ul>
    </section>

    <section class="current-section">
      <h2>🕒 最近一次学习</h2>
      <div v-if="!current" class="empty">暂无正在学习的文章</div>
      <div v-else class="current-card">
        <div class="current-info" @click="continueCurrent">
          <span class="current-title">{{ current.title }}</span>
          <span class="current-stage">第{{ current.currentStage }}轮</span>
        </div>
        <button class="continue-btn" @click.stop="continueCurrent">继续学习</button>
      </div>
    </section>

    <section class="recommend-section">
      <h2>⭐ 下一篇推荐</h2>
      <div v-if="!recommendation" class="empty">当前没有新篇推荐</div>
      <div v-else class="recommend-card" @click="browseRecommendation">
        <div class="recommend-info">
          <span class="recommend-title">{{ recommendation.title }}</span>
          <span class="recommend-topic">{{ recommendation.topic }}</span>
        </div>
        <button class="start-btn" @click.stop="browseRecommendation">浏览详情</button>
      </div>
    </section>

    <nav class="nav-links">
      <router-link to="/parent" class="nav-link">👨‍👩‍👧 家长中心</router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchDueList, fetchCurrent, fetchRecommendation } from '../api/index.js'

const router = useRouter()
const dueList = ref([])
const collectionName = ref('')
const loading = ref(true)
const current = ref(null)
const recommendation = ref(null)

async function loadDue() {
  try {
    const data = await fetchDueList()
    dueList.value = data.due || []
    // Derive collection name from first due item if available
    if (dueList.value.length > 0 && dueList.value[0].collection) {
      collectionName.value = dueList.value[0].collection
    }
  } catch (e) {
    console.error('Failed to load due list:', e)
  } finally {
    loading.value = false
  }
}

async function loadCurrent() {
  try {
    const data = await fetchCurrent()
    current.value = data.current || null
    if (!collectionName.value && current.value && current.value.collection) {
      collectionName.value = current.value.collection
    }
  } catch (e) {
    console.error('Failed to load current article:', e)
  }
}

async function loadRecommendation() {
  try {
    const data = await fetchRecommendation()
    recommendation.value = data.recommendation || null
    // If collection name wasn't set from due list/current, use recommendation
    if (!collectionName.value && recommendation.value) {
      collectionName.value = recommendation.value.collection
    }
  } catch (e) {
    console.error('Failed to load recommendation:', e)
  }
}

function continueCurrent() {
  if (!current.value) return
  router.push({ name: 'article', params: { articleId: current.value.articleId } })
}

function browseRecommendation() {
  if (!recommendation.value) return
  router.push({ name: 'article', params: { articleId: recommendation.value.articleId } })
}

function goToArticle(articleId) {
  router.push({ name: 'article', params: { articleId } })
}

onMounted(() => {
  loadDue()
  loadCurrent()
  loadRecommendation()
})
</script>

<style scoped>
.home-header {
  text-align: center;
  padding: 2rem 0 1rem;
  border-bottom: 2px solid var(--border-subtle);
  margin-bottom: 1.5rem;
}

.home-header h1 {
  font-size: 2rem;
  color: var(--ink-black);
  letter-spacing: 0.1em;
}

.collection-name {
  margin-top: 0.5rem;
  color: var(--ink-light);
  font-size: 0.9rem;
}

.due-section, .current-section, .recommend-section {
  margin-bottom: 2rem;
}

.due-section h2, .current-section h2, .recommend-section h2 {
  font-size: 1.2rem;
  color: var(--accent-red);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.current-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--paper-white);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.current-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  cursor: pointer;
}

.current-title {
  font-size: 1.05rem;
  color: var(--ink-black);
}

.current-stage {
  font-size: 0.85rem;
  color: var(--accent-gold);
  font-weight: 600;
}

.continue-btn {
  padding: 0.5rem 1rem;
  background: var(--accent-red, #c0392b);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
}

.loading, .empty {
  text-align: center;
  padding: 2rem;
  color: var(--ink-light);
}

.due-list {
  list-style: none;
  padding: 0;
}

.due-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  background: var(--paper-white);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
}

.due-item:hover {
  background: var(--paper-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.due-title {
  font-size: 1.05rem;
  color: var(--ink-black);
}

.due-stage {
  font-size: 0.85rem;
  color: var(--accent-gold);
  font-weight: 600;
}

.stub {
  text-align: center;
  color: var(--ink-light);
  padding: 1rem;
}

.recommend-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--paper-white);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
}

.recommend-card:hover {
  background: var(--paper-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.recommend-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.recommend-title {
  font-size: 1.05rem;
  color: var(--ink-black);
}

.recommend-topic {
  font-size: 0.85rem;
  color: var(--ink-light);
}

.start-btn {
  padding: 0.5rem 1rem;
  background: var(--accent-red, #c0392b);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.start-btn:hover {
  opacity: 0.9;
}

.nav-links {
  text-align: center;
  padding: 1.5rem 0;
  border-top: 1px solid var(--border-subtle);
  margin-top: 1rem;
}

.nav-link {
  color: var(--accent-red);
  text-decoration: none;
  font-size: 1rem;
  padding: 0.5rem 1rem;
}

.nav-link:hover {
  text-decoration: underline;
}
</style>
