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

    <section class="recommend-section">
      <h2>🌟 新篇推荐</h2>
      <p class="stub">（敬请期待）</p>
    </section>

    <nav class="nav-links">
      <router-link to="/parent" class="nav-link">👨‍👩‍👧 家长中心</router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchDueList } from '../api/index.js'

const router = useRouter()
const dueList = ref([])
const collectionName = ref('')
const loading = ref(true)

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

function goToArticle(articleId) {
  router.push({ name: 'article', params: { articleId } })
}

onMounted(loadDue)
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

.due-section, .recommend-section {
  margin-bottom: 2rem;
}

.due-section h2, .recommend-section h2 {
  font-size: 1.2rem;
  color: var(--accent-red);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
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
