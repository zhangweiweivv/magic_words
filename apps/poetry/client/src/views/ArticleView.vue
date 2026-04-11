<template>
  <div class="article-view">
    <PlumRainCanvas />
    <header class="article-header">
      <button class="back-btn" @click="router.push('/')">← 返回</button>
      <h1 class="article-title">{{ contentTitle || state?.title || articleId }}</h1>

      <div v-if="state" class="meta-badges">
        <span class="badge">{{ state.collection }}</span>
        <span class="badge badge-accent">第{{ state.currentStage }}/{{ state.totalStages }}轮</span>
        <span v-if="state.status === 'graduated'" class="badge badge-success">已毕业</span>
        <span v-else class="badge">学习中</span>
      </div>
      <div v-else class="meta-badges">
        <span class="badge">浏览模式</span>
        <span class="badge badge-muted">还未开始学习</span>
      </div>
    </header>

    <div class="ornament-divider" aria-hidden="true"></div>

    <nav v-if="chipItems.length" class="section-chips">
      <button
        v-for="item in chipItems"
        :key="item.key"
        class="chip"
        type="button"
        :data-chip="item.key"
        @click="scrollToSection(item.targetId)"
      >
        {{ item.label }}
      </button>
    </nav>

    <section class="article-content">
      <div v-if="loadingContent" class="placeholder-text">内容加载中…</div>
      <div v-else-if="contentError" class="placeholder-text">{{ contentError }}</div>
      <div v-else>
        <div v-if="sections.original" id="section-original" class="content-block">
          <h3 class="section-title">原文</h3>
          <div class="content-text">
            <template v-for="(line, idx) in formatSection(sections.original)" :key="`o-${idx}`">
              <div v-if="line.type === 'divider'" class="content-divider" />
              <div v-else-if="line.type === 'heading'" class="content-heading">{{ line.text }}</div>
              <div v-else class="content-line">{{ line.text }}</div>
            </template>
          </div>
        </div>
        <div v-if="sections.notes" id="section-notes" class="content-block">
          <h3 class="section-title">注释</h3>
          <div class="content-text">
            <template v-for="(line, idx) in formatSection(sections.notes)" :key="`n-${idx}`">
              <div v-if="line.type === 'divider'" class="content-divider" />
              <div v-else-if="line.type === 'heading'" class="content-heading">{{ line.text }}</div>
              <div v-else class="content-line">{{ line.text }}</div>
            </template>
          </div>
        </div>
        <div v-if="sections.translation" id="section-translation" class="content-block">
          <h3 class="section-title">译文</h3>
          <div class="content-text">
            <template v-for="(line, idx) in formatSection(sections.translation)" :key="`t-${idx}`">
              <div v-if="line.type === 'divider'" class="content-divider" />
              <div v-else-if="line.type === 'heading'" class="content-heading">{{ line.text }}</div>
              <div v-else class="content-line">{{ line.text }}</div>
            </template>
          </div>
        </div>
        <div v-if="sections.appreciation" id="section-appreciation" class="content-block">
          <h3 class="section-title">赏析</h3>
          <div class="content-text">
            <template v-for="(line, idx) in formatSection(sections.appreciation)" :key="`a-${idx}`">
              <div v-if="line.type === 'divider'" class="content-divider" />
              <div v-else-if="line.type === 'heading'" class="content-heading">{{ line.text }}</div>
              <div v-else class="content-line">{{ line.text }}</div>
            </template>
          </div>
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
        {{ completed ? '✅ 已完成' : '今日首学完成' }}
      </button>

      <button
        v-else
        class="complete-btn"
        :disabled="completed || state?.status === 'graduated'"
        @click="handleComplete"
      >
        {{ completed ? '✅ 已完成' : `✅ 今日第${state.currentStage}轮完成` }}
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
import PlumRainCanvas from '../components/PlumRainCanvas.vue'

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

const chipItems = ref([])

function rebuildChips() {
  const s = sections.value || {}
  const items = []
  if ((s.original || '').trim()) items.push({ key: 'original', label: '原文', targetId: 'section-original' })
  if ((s.notes || '').trim()) items.push({ key: 'notes', label: '注释', targetId: 'section-notes' })
  if ((s.translation || '').trim()) items.push({ key: 'translation', label: '译文', targetId: 'section-translation' })
  if ((s.appreciation || '').trim()) items.push({ key: 'appreciation', label: '赏析', targetId: 'section-appreciation' })
  chipItems.value = items
}

function scrollToSection(targetId) {
  const el = document.getElementById(targetId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function toChapterHeadingText(inner) {
  const s = String(inner || '').trim()
  if (!s) return ''
  // Common Chinese numerals used as chapter markers
  if (/^[一二三四五六七八九十]+$/.test(s)) return `（${s}）`
  return s
}

function stripBoldMarkers(text) {
  return String(text || '').replace(/\*\*(.*?)\*\*/g, '$1')
}

function formatSection(text) {
  if (!text) return []
  const lines = String(text).split('\n')
  return lines.map(raw => {
    const t = String(raw).trim()
    if (t === '***' || t === '---') return { type: 'divider', text: '' }

    const m = t.match(/^\*\*(.+?)\*\*$/)
    if (m) return { type: 'heading', text: toChapterHeadingText(m[1]) }

    return { type: 'text', text: stripBoldMarkers(raw) }
  })
}

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
    rebuildChips()
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
.article-view {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 1rem 2.5rem;
}

.article-header {
  padding: 1.5rem 0 1rem;
  border-bottom: 2px solid var(--border-subtle);
  margin-bottom: 0.75rem;
}

.back-btn {
  background: none;
  border: none;
  color: var(--accent-red);
  cursor: pointer;
  font-size: 1.1rem;
  font-family: inherit;
  margin-bottom: 0.5rem;
}

.article-header h1 {
  font-size: 1.6rem;
  color: var(--ink-black);
  letter-spacing: 0.05em;
}

.meta-badges {
  margin-top: 0.6rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--border-subtle);
  background: var(--paper-white);
  color: var(--ink-dark);
  font-size: 1rem;
}

.badge-muted {
  color: var(--ink-light);
}

.badge-accent {
  border-color: rgba(0, 0, 0, 0.08);
  background: rgba(192, 57, 43, 0.06);
  color: var(--accent-red);
}

.badge-success {
  background: rgba(39, 174, 96, 0.08);
  color: var(--success-green);
}

.ornament-divider {
  height: 14px;
  margin: 0.6rem 0 0.2rem;
  opacity: 0.75;
  background:
    radial-gradient(circle at 7px 7px, rgba(192, 57, 43, 0.25) 0 1px, transparent 1px),
    radial-gradient(circle at 21px 7px, rgba(212, 168, 67, 0.22) 0 1px, transparent 1px),
    linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.08) 15%, rgba(0, 0, 0, 0.08) 85%, transparent 100%);
  background-size: 28px 14px, 28px 14px, 100% 1px;
  background-repeat: repeat-x, repeat-x, no-repeat;
  background-position: 0 0, 0 0, 0 50%;
}

.section-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 0.75rem 0 1rem;
}

.chip {
  padding: 0.35rem 0.7rem;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  background: rgba(255, 252, 245, 0.85);
  color: var(--ink-dark);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
}

.chip:hover {
  background: rgba(250, 247, 240, 0.95);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.article-content {
  position: relative;
  overflow: hidden;
  min-height: 200px;
  padding: 2rem 1.9rem 2.1rem;
  background: var(--paper-white);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
}

/* 装订线（极淡） */
.article-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 18px;
  width: 1px;
  height: 100%;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.12) 10%, rgba(0, 0, 0, 0.08) 90%, transparent 100%);
  opacity: 0.35;
}

/* 纸张轻纹理（正文页内部） */
.article-content::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(rgba(0, 0, 0, 0.02) 0.5px, transparent 0.5px),
    repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.015) 0 1px, transparent 1px 14px);
  background-size: 26px 26px, 100% 100%;
  opacity: 0.35;
}

/* 确保内容在纹理层之上 */
.article-content > * {
  position: relative;
  z-index: 1;
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
  font-size: 1.2rem;
  color: var(--accent-red);
}

.content-text {
  line-height: 1.8;
  font-size: 1.15rem;
  color: var(--ink-black);
}

.content-line {
  white-space: pre-wrap;
}

.content-heading {
  margin: 0.6rem 0 0.2rem;
  font-weight: 800;
  color: var(--ink-dark);
  letter-spacing: 0.04em;
}

.content-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 0.9rem 0;
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
  font-size: 1.05rem;
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
