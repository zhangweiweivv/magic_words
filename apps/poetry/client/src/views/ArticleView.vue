<template>
  <div class="article-view">
    <header class="article-header">
      <button class="back-btn" @click="router.push('/')">← 返回</button>
      <h1>{{ contentTitle || state?.title || articleId }}</h1>
      <p v-if="state" class="article-meta">
        {{ state.collection }} · 第{{ state.currentStage }}/{{ state.totalStages }}轮
      </p>
      <p v-else class="article-meta">（浏览模式：还未开始学习）</p>
    </header>

    <section class="article-content">
      <div v-if="loadingContent" class="placeholder-text">内容加载中…</div>
      <div v-else-if="contentError" class="placeholder-text">{{ contentError }}</div>
      <div v-else>
        <div v-if="sections.original" class="content-block">
          <h3>原文</h3>
          <div class="content-text">{{ sections.original }}</div>
        </div>
        <div v-if="sections.notes" class="content-block">
          <h3>注释</h3>
          <div class="content-text">{{ sections.notes }}</div>
        </div>
        <div v-if="sections.translation" class="content-block">
          <h3>译文</h3>
          <div class="content-text">{{ sections.translation }}</div>
        </div>
        <div v-if="sections.appreciation" class="content-block">
          <h3>赏析</h3>
          <div class="content-text">{{ sections.appreciation }}</div>
        </div>
      </div>
    </section>

    <div class="actions">
      <button
        v-if="!state"
        class="start-learning-btn"
        :disabled="completed"
        @click="handleStart"
      >
        {{ completed ? '✅ 已完成' : '今日已学完' }}
      </button>

      <button
        v-else
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
import { fetchArticleState, fetchArticleContent, completeArticle } from '../api/index.js'

const route = useRoute()
const router = useRouter()
const articleId = route.params.articleId

const state = ref(null)
const completed = ref(false)
const error = ref('')

const contentTitle = ref('')
const sections = ref({ original: '', notes: '', translation: '', appreciation: '' })
const loadingContent = ref(true)
const contentError = ref('')

async function loadState() {
  try {
    const data = await fetchArticleState(articleId)
    state.value = data.state
  } catch (e) {
    // Article may not have state yet
    console.warn('No state for article:', e.message)
  }
}

async function loadContent() {
  try {
    loadingContent.value = true
    contentError.value = ''
    const data = await fetchArticleContent(articleId)
    contentTitle.value = data.title
    sections.value = data.sections || { original: '', notes: '', translation: '', appreciation: '' }
  } catch (e) {
    contentError.value = `未找到正文内容（${e.message}）`
  } finally {
    loadingContent.value = false
  }
}

async function handleStart() {
  try {
    error.value = ''
    const data = await completeArticle(articleId)
    state.value = data.state
    completed.value = true
  } catch (e) {
    error.value = e.message
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

onMounted(() => {
  loadContent()
  loadState()
})
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

.content-block {
  margin-bottom: 1.5rem;
}

.content-block h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: var(--accent-red);
}

.content-text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--ink-black);
}

.start-learning-btn {
  width: 100%;
  max-width: 300px;
  padding: 0.8rem 1.5rem;
  font-size: 1.1rem;
  font-family: inherit;
  color: white;
  background: var(--accent-red, #c0392b);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.start-learning-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.start-learning-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
