<template>
  <div class="parent-view">
    <header class="parent-header">
      <button class="back-btn" @click="router.push('/')">← 返回首页</button>
      <h1>👨‍👩‍👧 家长中心</h1>
    </header>

    <!-- Section A (existing): Effects -->
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

    <!-- Section 1: Default rules disclosure -->
    <section class="card" data-test="difficulty-rules">
      <h2>默认难度规则（公开透明）</h2>
      <p class="hint">
        系统会根据文章难度（1-4）给出默认复习轮次与间隔（天）。
        下面展示的是当前生效的默认配置（来自服务端持久化配置；没有配置则使用内置默认值）。
      </p>

      <div v-if="rulesError" class="error">{{ rulesError }}</div>
      <div v-else-if="!difficultyDefaults" class="hint">加载中...</div>
      <div v-else class="rules-grid">
        <div v-for="level in [1,2,3,4]" :key="level" class="rule-item">
          <div class="rule-title">难度 {{ level }}</div>
          <div class="rule-body">
            <div>总轮次：{{ difficultyDefaults[level]?.totalStages }}</div>
            <div>间隔：{{ difficultyDefaults[level]?.intervals?.join(', ') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2: Difficulty-level defaults editor -->
    <section class="card">
      <h2>编辑难度默认配置（可批量应用）</h2>

      <div class="form-row">
        <label>难度等级</label>
        <select v-model="editLevel" class="form-input" data-test="level-select">
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      </div>

      <div class="form-row">
        <label>总轮次</label>
        <input
          v-model.number="editTotalStages"
          type="number"
          min="1"
          class="form-input"
          data-test="level-totalStages"
        />
      </div>

      <div class="form-row">
        <label>复习间隔（逗号分隔天数）</label>
        <input
          v-model="editIntervalsStr"
          placeholder="1,2,5"
          class="form-input"
          data-test="level-intervals"
        />
        <p class="hint">要求：间隔数组长度必须 ≥ 总轮次（否则无法覆盖所有轮次）。</p>
      </div>

      <label class="toggle-row">
        <input type="checkbox" v-model="applyToExisting" />
        <span class="toggle-label">
          同步应用到已学习文章（只影响 scheduleSource=level_default 的文章；override 不会被覆盖）
        </span>
      </label>

      <button class="save-btn" data-test="level-save" @click="saveLevelDefaults" :disabled="savingLevel">
        {{ savingLevel ? '保存中...' : '💾 保存难度默认配置' }}
      </button>

      <div v-if="levelError" class="save-result error" data-test="level-error">{{ levelError }}</div>
      <div v-if="levelOk" class="save-result success">✅ 已保存</div>
    </section>

    <!-- Section 3: Per-collection list with override/reset -->
    <section class="card">
      <h2>按合集查看（难度/覆盖/重置）</h2>

      <div class="form-row">
        <label>选择合集</label>
        <select v-model="selectedCollection" class="form-input" @change="loadCollection" data-test="collection-select">
          <option v-for="c in collections" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <div v-if="collectionError" class="error">{{ collectionError }}</div>
      <div v-else-if="loadingCollection" class="hint">加载中...</div>

      <div v-if="articles.length" class="table">
        <div class="table-row table-head">
          <div>文章</div>
          <div>难度</div>
          <div>来源</div>
          <div>状态</div>
          <div>操作</div>
        </div>

        <div v-for="a in articles" :key="a.articleId" class="table-row">
          <div class="title-col">
            <div class="title">{{ a.title }}</div>
            <div class="sub">{{ a.articleId }} · {{ a.section }}</div>
          </div>
          <div>{{ a.difficulty ?? '—' }}</div>
          <div>{{ a.scheduleSource ?? '—' }}</div>
          <div>{{ a.status }}</div>
          <div class="actions">
            <button
              class="small-btn"
              :data-test="`override-btn-${a.articleId}`"
              @click="openOverride(a)"
            >覆盖</button>
            <button
              class="small-btn danger"
              :data-test="`reset-btn-${a.articleId}`"
              @click="doReset(a)"
            >重置为默认</button>
          </div>
        </div>
      </div>

      <!-- Override editor (inline, single target at a time) -->
      <div v-if="overrideTarget" class="override-card">
        <h3>覆盖复习计划：{{ overrideTarget.title }}（{{ overrideTarget.articleId }}）</h3>
        <p class="hint">覆盖后该文章 scheduleSource 将标记为 override，不会被批量默认配置覆盖。</p>

        <div class="form-row">
          <label>总轮次</label>
          <input
            v-model.number="overrideTotalStages"
            type="number"
            min="1"
            class="form-input"
            data-test="override-totalStages"
          />
        </div>

        <div class="form-row">
          <label>复习间隔（逗号分隔天数）</label>
          <input
            v-model="overrideIntervalsStr"
            class="form-input"
            placeholder="1,3,7"
            data-test="override-intervals"
          />
        </div>

        <button class="save-btn" data-test="override-save" @click="saveOverride" :disabled="savingOverride">
          {{ savingOverride ? '保存中...' : '💾 保存覆盖' }}
        </button>

        <div v-if="overrideError" class="save-result error">{{ overrideError }}</div>
        <div v-if="overrideOk" class="save-result success">✅ 已保存</div>
      </div>
    </section>

    <!-- Keep legacy manual per-article config (optional) -->
    <section class="card">
      <h2>手动按文章ID调整（高级/兼容）</h2>
      <div class="search-bar">
        <input v-model="searchId" placeholder="输入文章ID" class="search-input" />
        <button class="search-btn" @click="loadArticle">查找</button>
      </div>

      <section v-if="state" class="config-form">
        <h3>{{ state.title }} ({{ state.articleId }})</h3>
        <p class="current-info">
          当前：{{ state.currentStage }}/{{ state.totalStages }}轮，
          间隔 {{ state.intervals?.join(', ') }} 天，
          来源：{{ state.scheduleSource || 'level_default' }}
        </p>

        <div class="form-group">
          <label>总轮次</label>
          <input v-model.number="newTotalStages" type="number" min="1" class="form-input" />
        </div>

        <div class="form-group">
          <label>复习间隔（逗号分隔天数）</label>
          <input v-model="newIntervalsStr" placeholder="1,2,4,7,14" class="form-input" />
        </div>

        <div class="actions">
          <button class="save-btn" @click="saveConfig" :disabled="saving">
            {{ saving ? '保存中...' : '💾 保存修改（覆盖）' }}
          </button>
          <button class="small-btn danger" @click="manualReset" :disabled="savingReset">
            {{ savingReset ? '重置中...' : '重置为默认' }}
          </button>
        </div>

        <div v-if="saveResult" class="save-result success">✅ 已保存</div>
        <div v-if="saveError" class="save-result error">{{ saveError }}</div>
      </section>

      <div v-if="loadError" class="error">{{ loadError }}</div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchArticleState,
  updateArticleConfig,
  fetchDifficultyRules,
  fetchAdminCollections,
  fetchCollectionArticles,
  updateDifficultyLevel,
  overrideArticleSchedule,
  resetArticleToDefault
} from '../api/index.js'
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

// ── admin state ──────────────────────────────────────────
const difficultyDefaults = ref(null)
const rulesError = ref('')

const editLevel = ref('2')
const editTotalStages = ref(3)
const editIntervalsStr = ref('1,3,7')
const applyToExisting = ref(false)
const savingLevel = ref(false)
const levelError = ref('')
const levelOk = ref(false)

const collections = ref([])
const selectedCollection = ref('')
const articles = ref([])
const loadingCollection = ref(false)
const collectionError = ref('')

const overrideTarget = ref(null)
const overrideTotalStages = ref(3)
const overrideIntervalsStr = ref('')
const savingOverride = ref(false)
const overrideError = ref('')
const overrideOk = ref(false)

function parseIntervals(str) {
  return String(str)
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isFinite(n) && n > 0)
}

async function loadRules() {
  rulesError.value = ''
  try {
    const data = await fetchDifficultyRules()
    difficultyDefaults.value = data.defaults

    // sync editor defaults based on selected level
    const lvl = Number(editLevel.value)
    const cfg = data.defaults?.[lvl]
    if (cfg) {
      editTotalStages.value = cfg.totalStages
      editIntervalsStr.value = cfg.intervals.join(',')
    }
  } catch (e) {
    rulesError.value = e.message
  }
}

async function loadCollections() {
  try {
    const data = await fetchAdminCollections()
    collections.value = data.collections || []
    if (!selectedCollection.value && collections.value.length) {
      selectedCollection.value = collections.value[0]
      await loadCollection()
    }
  } catch (e) {
    collectionError.value = e.message
  }
}

async function loadCollection() {
  if (!selectedCollection.value) return
  loadingCollection.value = true
  collectionError.value = ''
  try {
    const data = await fetchCollectionArticles(selectedCollection.value)
    articles.value = data.articles || []
  } catch (e) {
    collectionError.value = e.message
  } finally {
    loadingCollection.value = false
  }
}

watch(editLevel, (v) => {
  levelOk.value = false
  levelError.value = ''
  const lvl = Number(v)
  const cfg = difficultyDefaults.value?.[lvl]
  if (cfg) {
    editTotalStages.value = cfg.totalStages
    editIntervalsStr.value = cfg.intervals.join(',')
  }
})

async function saveLevelDefaults() {
  levelError.value = ''
  levelOk.value = false

  const lvl = Number(editLevel.value)
  const intervals = parseIntervals(editIntervalsStr.value)
  if (editTotalStages.value < 1) {
    levelError.value = 'totalStages 必须 ≥ 1'
    return
  }
  if (intervals.length < editTotalStages.value) {
    levelError.value = '间隔数组长度必须 ≥ 总轮次'
    return
  }

  savingLevel.value = true
  try {
    await updateDifficultyLevel(lvl, {
      totalStages: editTotalStages.value,
      intervals,
      applyToExisting: applyToExisting.value
    })
    levelOk.value = true
    await loadRules()
    if (applyToExisting.value) {
      await loadCollection()
    }
  } catch (e) {
    levelError.value = e.message
  } finally {
    savingLevel.value = false
  }
}

function openOverride(article) {
  overrideTarget.value = article
  overrideOk.value = false
  overrideError.value = ''
  overrideTotalStages.value = article.totalStages || 3
  overrideIntervalsStr.value = (article.intervals || []).join(',')
}

async function saveOverride() {
  if (!overrideTarget.value) return
  overrideError.value = ''
  overrideOk.value = false

  const intervals = parseIntervals(overrideIntervalsStr.value)
  if (overrideTotalStages.value < 1) {
    overrideError.value = 'totalStages 必须 ≥ 1'
    return
  }
  if (intervals.length < overrideTotalStages.value) {
    overrideError.value = '间隔数组长度必须 ≥ 总轮次'
    return
  }

  savingOverride.value = true
  try {
    await overrideArticleSchedule(overrideTarget.value.articleId, {
      totalStages: overrideTotalStages.value,
      intervals
    })
    overrideOk.value = true
    await loadCollection()
  } catch (e) {
    overrideError.value = e.message
  } finally {
    savingOverride.value = false
  }
}

async function doReset(article) {
  try {
    await resetArticleToDefault(article.articleId)
    await loadCollection()
  } catch (e) {
    collectionError.value = e.message
  }
}

// ── legacy manual per-article config ─────────────────────
const searchId = ref('')
const state = ref(null)
const loadError = ref('')

const newTotalStages = ref(5)
const newIntervalsStr = ref('')
const saving = ref(false)
const saveResult = ref(false)
const saveError = ref('')

const savingReset = ref(false)

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
    const intervals = parseIntervals(newIntervalsStr.value)
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

async function manualReset() {
  if (!state.value) return
  savingReset.value = true
  saveError.value = ''
  saveResult.value = false
  try {
    const data = await resetArticleToDefault(state.value.articleId)
    state.value = data.state
    newTotalStages.value = data.state.totalStages
    newIntervalsStr.value = data.state.intervals?.join(', ') || ''
    saveResult.value = true
  } catch (e) {
    saveError.value = e.message
  } finally {
    savingReset.value = false
  }
}

onMounted(async () => {
  syncPlumRainEnabledFromStorage()
  reducedMotion.value = isReducedMotion()

  await loadRules()
  await loadCollections()
})
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

.card {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--paper-white);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}

.effects-settings {
  margin-bottom: 1.5rem;
}

.effects-settings h2,
.card h2 {
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

.rules-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.rule-item {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 0.75rem;
}

.rule-title {
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.rule-body {
  color: var(--ink-dark);
  font-size: 0.95rem;
}

.form-row {
  margin-bottom: 0.8rem;
}

.form-row label {
  display: block;
  font-size: 0.9rem;
  color: var(--ink-dark);
  margin-bottom: 0.25rem;
}

.form-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
}

.search-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
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

.small-btn {
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--border-subtle);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}

.small-btn.danger {
  border-color: var(--accent-red-light);
  color: var(--accent-red);
}

.save-result {
  text-align: center;
  padding: 0.5rem;
  font-size: 0.9rem;
}

.save-result.success { color: var(--success-green); }
.save-result.error { color: var(--accent-red-light); }
.error { color: var(--accent-red-light); text-align: center; padding: 0.5rem 0; }

.table {
  margin-top: 0.75rem;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 0.6fr 1fr 1fr 1.2fr;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-top: 1px solid var(--border-subtle);
  align-items: center;
}

.table-head {
  background: #faf7f2;
  font-weight: 700;
  border-top: none;
}

.title {
  font-weight: 600;
}

.sub {
  font-size: 0.85rem;
  color: var(--ink-light);
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.override-card {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--border-subtle);
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
</style>
