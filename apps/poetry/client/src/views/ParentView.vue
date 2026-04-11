<template>
  <div class="parent-view">
    <header class="parent-header">
      <button class="back-btn" @click="router.push('/')">← 返回首页</button>
      <h1>👨‍👩‍👧 家长中心</h1>
    </header>

    <section class="effects-settings">
      <h2>页面特效</h2>
      <label class="toggle-row">
        <input
          class="toggle-input"
          type="checkbox"
          data-test="plum-rain-toggle"
          v-model="plumRainOn"
        />
        <span class="toggle-label">梅花雨特效</span>
      </label>
      <p v-if="reducedMotion" class="hint">系统已开启“减少动态效果”，将自动不播放</p>
    </section>

    <section class="article-search">
      <h2>调整复习计划</h2>
      <div class="search-bar">
        <input
          v-model="searchId"
          placeholder="输入文章ID"
          class="search-input"
        />
        <button class="search-btn" @click="loadArticle">查找</button>
      </div>
    </section>

    <section v-if="state" class="config-form">
      <h3>{{ state.title }} ({{ state.articleId }})</h3>
      <p class="current-info">
        当前：{{ state.currentStage }}/{{ state.totalStages }}轮，
        间隔 {{ state.intervals?.join(', ') }} 天
      </p>

      <div class="form-group">
        <label>总轮次</label>
        <input v-model.number="newTotalStages" type="number" min="1" class="form-input" />
      </div>

      <div class="form-group">
        <label>复习间隔（逗号分隔天数）</label>
        <input v-model="newIntervalsStr" placeholder="1,2,4,7,14" class="form-input" />
      </div>

      <button class="save-btn" @click="saveConfig" :disabled="saving">
        {{ saving ? '保存中...' : '💾 保存修改' }}
      </button>

      <div v-if="saveResult" class="save-result success">✅ 已保存</div>
      <div v-if="saveError" class="save-result error">{{ saveError }}</div>
    </section>

    <div v-if="loadError" class="error">{{ loadError }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchArticleState, updateArticleConfig } from '../api/index.js'
import {
  plumRainEnabled,
  setPlumRainEnabled,
  syncPlumRainEnabledFromStorage,
  isReducedMotion
} from '../utils/plumRainSetting.js'

const router = useRouter()

const reducedMotion = ref(isReducedMotion())

const plumRainOn = computed({
  get: () => plumRainEnabled.value,
  set: (v) => setPlumRainEnabled(v)
})

onMounted(() => {
  syncPlumRainEnabledFromStorage()
  reducedMotion.value = isReducedMotion()
})

const searchId = ref('')
const state = ref(null)
const loadError = ref('')

const newTotalStages = ref(5)
const newIntervalsStr = ref('')
const saving = ref(false)
const saveResult = ref(false)
const saveError = ref('')

async function loadArticle() {
  if (!searchId.value.trim()) return
  loadError.value = ''
  state.value = null
  try {
    const data = await fetchArticleState(searchId.value.trim())
    state.value = data.state
    newTotalStages.value = data.state.totalStages
    newIntervalsStr.value = data.state.intervals?.join(', ') || ''
  } catch (e) {
    loadError.value = e.message
  }
}

async function saveConfig() {
  saving.value = true
  saveError.value = ''
  saveResult.value = false
  try {
    const intervals = newIntervalsStr.value.split(',').map(s => Number(s.trim())).filter(n => n > 0)
    if (intervals.length === 0) {
      saveError.value = '请输入有效的间隔天数'
      return
    }
    const data = await updateArticleConfig(state.value.articleId, {
      totalStages: newTotalStages.value,
      intervals
    })
    state.value = data.state
    saveResult.value = true
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.parent-header {
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

.parent-header h1 {
  font-size: 1.6rem;
  color: var(--ink-black);
}

.effects-settings {
  margin-bottom: 2rem;
}

.effects-settings h2 {
  font-size: 1.1rem;
  color: var(--accent-red);
  margin-bottom: 0.8rem;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1rem;
  background: var(--paper-white);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.toggle-input {
  width: 18px;
  height: 18px;
}

.toggle-label {
  font-size: 1rem;
  color: var(--ink-dark);
}

.hint {
  margin-top: 0.5rem;
  color: var(--ink-light);
  font-size: 0.9rem;
}

.article-search h2 {
  font-size: 1.1rem;
  color: var(--accent-red);
  margin-bottom: 0.8rem;
}

.search-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
}

.search-btn {
  padding: 0.6rem 1.2rem;
  background: var(--accent-red);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}

.config-form h3 {
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
}

.current-info {
  color: var(--ink-light);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  color: var(--ink-dark);
  margin-bottom: 0.3rem;
}

.form-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
}

.save-btn {
  width: 100%;
  padding: 0.7rem;
  background: var(--accent-gold);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-result {
  text-align: center;
  padding: 0.5rem;
  font-size: 0.9rem;
}

.save-result.success { color: var(--success-green); }
.save-result.error { color: var(--accent-red-light); }
.error { color: var(--accent-red-light); text-align: center; padding: 1rem; }
</style>
