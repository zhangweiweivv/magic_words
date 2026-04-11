<template>
  <div class="article-view">
    <header class="article-header">
      <button class="back-btn" @click="router.push('/')">← 返回</button>
      <h1>{{ state?.title || articleId }}</h1>
      <p v-if="state" class="article-meta">
        {{ state.collection }} · 第{{ state.currentStage }}/{{ state.totalStages }}轮
      </p>
    </header>

    <section class="article-content">
      <p class="placeholder-text">
        （当前版本：已实现“推荐/进度/艾宾浩斯/记录/家长配置”。
        <br />
        正文内容（原文/注释/译文/赏析/拼音）还没录入到 Obsidian，因此这里暂时不展示。
        <br />
        等我把《小红本》寅集的每篇正文整理成：<code>小红本/{{ state?.collection || '寅集' }}/{{ articleId }}-*.md</code> 后，这里会自动显示。）
      </p>
    </section>

    <div class="actions">
      <button
        class="complete-btn"
        :disabled="completed || state?.status === 'graduated'"
        @click="handleComplete"
      >
        {{ completed ? '✅ 已完成' : '✅ 今日已学完' }}
      </button>

      <router-link
        v-if="state"
        :to="{ name: 'article-detail', params: { articleId } }"
        class="detail-link"
      >
        📊 查看学习记录
      </router-link>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchArticleState, completeArticle } from '../api/index.js'

const route = useRoute()
const router = useRouter()
const articleId = route.params.articleId

const state = ref(null)
const completed = ref(false)
const error = ref('')

async function loadState() {
  try {
    const data = await fetchArticleState(articleId)
    state.value = data.state
  } catch (e) {
    // Article may not have state yet
    console.warn('No state for article:', e.message)
  }
}

async function handleComplete() {
  try {
    error.value = ''
    const data = await completeArticle(articleId)
    state.value = data.state
    completed.value = true
  } catch (e) {
    error.value = e.message
  }
}

onMounted(loadState)
</script>

<style scoped>
.article-header {
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

.article-header h1 {
  font-size: 1.6rem;
  color: var(--ink-black);
  letter-spacing: 0.05em;
}

.article-meta {
  margin-top: 0.3rem;
  color: var(--ink-light);
  font-size: 0.9rem;
}

.article-content {
  min-height: 200px;
  padding: 1.5rem;
  background: var(--paper-white);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.placeholder-text {
  color: var(--ink-light);
  text-align: center;
  padding: 3rem 0;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.complete-btn {
  width: 100%;
  max-width: 300px;
  padding: 0.8rem 1.5rem;
  font-size: 1.1rem;
  font-family: inherit;
  color: white;
  background: var(--success-green);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.complete-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.complete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail-link {
  color: var(--accent-red);
  text-decoration: none;
  font-size: 0.95rem;
}

.detail-link:hover {
  text-decoration: underline;
}

.error {
  color: var(--accent-red-light);
  text-align: center;
  padding: 0.5rem;
}
</style>
