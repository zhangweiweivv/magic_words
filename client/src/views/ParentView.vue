<!-- client/src/views/ParentView.vue -->
<template>
  <div class="parent-page">
    <!-- 密码验证界面 -->
    <div v-if="!verified" class="password-gate">
      <div class="gate-card">
        <div class="gate-icon">🔐</div>
        <h2>家长中心</h2>
        <p>请输入家长密码</p>
        <div class="password-input-wrapper">
          <input 
            v-model="password" 
            type="password" 
            placeholder="请输入密码"
            @keyup.enter="verifyPassword"
            class="password-input"
          />
        </div>
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <div class="gate-buttons">
          <button class="btn btn-primary" @click="verifyPassword" :disabled="!password">
            进入
          </button>
          <button class="btn btn-secondary" @click="$router.push('/')">
            返回首页
          </button>
        </div>
      </div>
    </div>

    <!-- 家长中心内容 -->
    <div v-else class="parent-content">
      <header class="parent-header">
        <h1>📊 家长中心</h1>
        <button class="btn btn-logout" @click="logout">退出</button>
      </header>

      <!-- 学习日历热力图 -->
      <section class="section">
        <h2 class="section-title">📅 学习日历</h2>
        <div class="calendar-container">
          <div class="calendar-header">
            <button class="btn btn-icon" @click="prevMonth">←</button>
            <span class="calendar-month">{{ calendarTitle }}</span>
            <button class="btn btn-icon" @click="nextMonth">→</button>
          </div>
          <div class="calendar-weekdays">
            <span v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day">{{ day }}</span>
          </div>
          <div class="calendar-grid">
            <div 
              v-for="(day, idx) in calendarDays" 
              :key="idx"
              class="calendar-day"
              :class="getDayClass(day)"
              :title="getDayTitle(day)"
            >
              <span v-if="day.date">{{ day.date }}</span>
            </div>
          </div>
          <div class="calendar-legend">
            <span><span class="legend-dot level-0"></span>无记录</span>
            <span><span class="legend-dot level-1"></span>1-10词</span>
            <span><span class="legend-dot level-2"></span>11-30词</span>
            <span><span class="legend-dot level-3"></span>31+词</span>
          </div>
        </div>
      </section>

      <!-- 薄弱单词 Top 10 -->
      <section class="section">
        <h2 class="section-title">⚠️ 薄弱单词 Top 10</h2>
        <div v-if="weakWords.length === 0" class="empty-state">
          <div class="empty-icon">🎉</div>
          <p>没有薄弱单词，继续保持！</p>
        </div>
        <div v-else class="weak-words-list">
          <div v-for="(word, idx) in weakWords" :key="word.word" class="weak-word-item">
            <span class="word-rank">#{{ idx + 1 }}</span>
            <span class="word-text">{{ word.word }}</span>
            <span class="word-meaning">{{ word.meaning }}</span>
            <span class="word-errors">错{{ word.errorCount || 0 }}次</span>
          </div>
        </div>
      </section>

      <!-- 现实奖励管理 -->
      <section class="section">
        <h2 class="section-title">🎁 现实奖励管理</h2>
        <div class="reward-form">
          <input 
            v-model="newReward.name" 
            placeholder="奖励名称（如：买一本书）"
            class="form-input"
          />
          <input 
            v-model.number="newReward.price" 
            type="number" 
            placeholder="所需积分"
            class="form-input small"
          />
          <button class="btn btn-primary" @click="addReward" :disabled="!newReward.name || !newReward.price">
            添加奖励
          </button>
        </div>
        <div v-if="realRewards.length === 0" class="empty-state small">
          <p>暂无现实奖励，添加一个吧！</p>
        </div>
        <div v-else class="rewards-list">
          <div v-for="reward in realRewards" :key="reward.name" class="reward-item">
            <span class="reward-icon">🎁</span>
            <span class="reward-name">{{ reward.name }}</span>
            <span class="reward-price">{{ reward.price }} 积分</span>
            <span class="reward-status" :class="reward.redeemed ? 'redeemed' : 'available'">
              {{ reward.redeemed ? '已兑换' : '可兑换' }}
            </span>
          </div>
        </div>
      </section>

      <!-- 测试配置 -->
      <section class="section">
        <h2 class="section-title">⚙️ 测试配置</h2>
        <div v-if="configLoading" class="empty-state small"><p>加载中...</p></div>
        <div v-else>
          <!-- 题目配比 -->
          <h3 class="config-subtitle">📝 题目配比</h3>
          <div class="quiz-config-table">
            <div class="quiz-config-header">
              <span class="col-stage">阶段</span>
              <span class="col-num">拼写</span>
              <span class="col-num">填空</span>
              <span class="col-num">选择</span>
              <span class="col-num">总题数</span>
              <span class="col-rate">通过率</span>
            </div>
            <div v-for="(level, idx) in quizLevels" :key="idx" class="quiz-config-row">
              <span class="col-stage">{{ configForm.stageNames[idx] || `Level ${idx}` }}</span>
              <span class="col-num">
                <input type="number" v-model.number="level.spelling" min="0" class="config-input" />
              </span>
              <span class="col-num">
                <input type="number" v-model.number="level.fillBlank" min="0" class="config-input" />
              </span>
              <span class="col-num">
                <input type="number" v-model.number="level.choice" min="0" class="config-input" />
              </span>
              <span class="col-num total-count">{{ level.spelling + level.fillBlank + level.choice }}</span>
              <span class="col-rate">
                <input type="number" v-model.number="level.passRate" min="0" max="100" step="5" class="config-input" /><span class="unit">%</span>
              </span>
            </div>
          </div>

          <!-- 其他参数 -->
          <h3 class="config-subtitle">🎛️ 其他参数</h3>
          <div class="config-params">
            <div class="config-param-row">
              <label>填空隐藏比例</label>
              <div class="param-input-group">
                <input type="range" v-model.number="configForm.fillBlankHideRatio" min="0" max="100" step="5" class="config-slider" />
                <span class="param-value">{{ configForm.fillBlankHideRatio }}%</span>
              </div>
            </div>
            <div class="config-param-row">
              <label>每日新词上限</label>
              <div class="param-input-group">
                <input type="number" v-model.number="configForm.dailyLimit" min="1" max="50" class="config-input wide" />
                <span class="unit">个</span>
              </div>
            </div>
            <div class="config-param-row">
              <label>复习间隔天数</label>
              <div class="param-input-group">
                <span v-for="(interval, i) in configForm.intervals" :key="i" class="interval-chip">
                  Day <input type="number" v-model.number="configForm.intervals[i]" min="0" class="config-input tiny" />
                </span>
              </div>
            </div>
          </div>

          <div class="config-actions">
            <button class="btn btn-primary" @click="saveConfig" :disabled="configSaving">
              {{ configSaving ? '保存中...' : '💾 保存配置' }}
            </button>
            <span v-if="configSaveMsg" class="config-save-msg" :class="configSaveMsgType">{{ configSaveMsg }}</span>
          </div>
        </div>
      </section>

      <!-- 单词扩充配置 -->
      <section class="section">
        <h2 class="section-title">📖 单词扩充配置</h2>
        <div v-if="expansionLoading" class="empty-state small"><p>加载中...</p></div>
        <div v-else>
          <!-- 扩充参数 -->
          <h3 class="config-subtitle">🎛️ 扩充参数</h3>
          <div class="config-params">
            <div class="config-param-row">
              <label>每次扩充词数</label>
              <div class="param-input-group">
                <input type="number" v-model.number="expansionForm.batchSize" min="5" max="50" class="config-input wide" />
                <span class="unit">个</span>
              </div>
            </div>
            <div class="config-param-row">
              <label>扩充间隔</label>
              <div class="param-input-group">
                <input type="number" v-model.number="expansionForm.intervalDays" min="1" max="14" class="config-input wide" />
                <span class="unit">天</span>
              </div>
            </div>

          </div>

          <!-- 各级别配比 -->
          <h3 class="config-subtitle">📊 各级别配比</h3>
          <div class="ratio-config">
            <div class="ratio-row">
              <label>A1 基础词</label>
              <div class="ratio-input-group">
                <input type="range" v-model.number="ratioA1" min="0" max="100" step="5" class="config-slider" />
                <span class="param-value">{{ ratioA1 }}%</span>
              </div>
            </div>
            <div class="ratio-row">
              <label>A2 进阶词</label>
              <div class="ratio-input-group">
                <input type="range" v-model.number="ratioA2" min="0" max="100" step="5" class="config-slider" />
                <span class="param-value">{{ ratioA2 }}%</span>
              </div>
            </div>
            <div class="ratio-row">
              <label>B1 中高级</label>
              <div class="ratio-input-group">
                <input type="range" v-model.number="ratioB1" min="0" max="100" step="5" class="config-slider" />
                <span class="param-value">{{ ratioB1 }}%</span>
              </div>
            </div>
            <div class="ratio-total" :class="{ 'ratio-error': ratioTotal !== 100 }">
              合计: {{ ratioTotal }}%
              <span v-if="ratioTotal !== 100" class="ratio-warning">⚠️ 三项之和必须等于 100%</span>
              <span v-else class="ratio-ok">✅</span>
            </div>
          </div>

          <div class="config-actions">
            <button class="btn btn-primary" @click="saveExpansionConfig" :disabled="expansionSaving || ratioTotal !== 100">
              {{ expansionSaving ? '保存中...' : '💾 保存扩充配置' }}
            </button>
            <span v-if="expansionSaveMsg" class="config-save-msg" :class="expansionSaveMsgType">{{ expansionSaveMsg }}</span>
          </div>

          <!-- 扩充进度（只读） -->
          <h3 class="config-subtitle">📈 扩充进度</h3>
          <div class="expansion-progress">
            <div class="progress-item">
              <span class="progress-label">已扩充总数</span>
              <span class="progress-value">{{ expansionStatus.totalAdded || 0 }} 词</span>
            </div>
            <div class="progress-item">
              <span class="progress-label">各级别已扩充</span>
              <span class="progress-value">
                A1={{ expansionStatus.progress?.A1 || 0 }}, 
                A2={{ expansionStatus.progress?.A2 || 0 }}, 
                B1={{ expansionStatus.progress?.B1 || 0 }}
              </span>
            </div>
            <div class="progress-item">
              <span class="progress-label">上次扩充日期</span>
              <span class="progress-value">{{ expansionStatus.lastExpansion || '无' }}</span>
            </div>
            <div class="progress-item">
              <span class="progress-label">下次扩充日期</span>
              <span class="progress-value">{{ expansionStatus.nextExpansion || '未知' }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 撤销今日学习 -->
      <section class="section">
        <h2 class="section-title">🔄 撤销今日学习</h2>
        <p class="section-desc">
          测试完毕后，可撤销今日的学习数据，让可可重新完成今天的任务。
        </p>
        <div v-if="!hasBackup" class="empty-state small">
          <p>📭 今天还没有学习记录，无需撤销</p>
        </div>
        <div v-else>
          <div v-if="!showRestoreConfirm">
            <button class="btn btn-danger" @click="confirmRestore">
              🔄 撤销今日学习数据
            </button>
          </div>
          <div v-else class="confirm-box">
            <p class="confirm-text">⚠️ 确定撤销今天的学习记录吗？可可需要重新完成今日任务。</p>
            <div class="confirm-buttons">
              <button class="btn btn-danger" @click="doRestore" :disabled="restoring">
                {{ restoring ? '正在还原...' : '确定撤销' }}
              </button>
              <button class="btn btn-secondary" @click="cancelRestore" :disabled="restoring">
                取消
              </button>
            </div>
          </div>
          <div v-if="restoreResult" class="restore-result">{{ restoreResult }}</div>
        </div>
      </section>

      <!-- 积分变动历史 -->
      <section class="section">
        <h2 class="section-title">💰 积分变动历史</h2>
        <div class="points-summary">
          <div class="points-current">
            <span class="points-label">当前积分</span>
            <span class="points-value">{{ currentPoints }}</span>
          </div>
          <div class="points-stats">
            <span>总获得: <strong>{{ totalEarned }}</strong></span>
            <span>总消费: <strong>{{ totalSpent }}</strong></span>
          </div>
        </div>
        <div v-if="pointsHistory.length === 0" class="empty-state small">
          <p>暂无积分记录</p>
        </div>
        <div v-else class="history-list">
          <div 
            v-for="(record, idx) in pointsHistory.slice(0, 20)" 
            :key="idx" 
            class="history-item"
            :class="record.points > 0 ? 'earned' : 'spent'"
          >
            <span class="history-time">{{ formatTime(record.timestamp) }}</span>
            <span class="history-action">{{ record.action }}</span>
            <span class="history-points">{{ record.points > 0 ? '+' : '' }}{{ record.points }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { shopApi } from '../api/shop'
import { statsApi } from '../api/stats'
import { pointsApi } from '../api/points'
import { backupApi } from '../api/backup'

// 验证状态
const verified = ref(false)
const password = ref('')
const errorMsg = ref('')

// 数据
const calendarData = ref({})
const weakWords = ref([])
const realRewards = ref([])
const pointsData = ref({ points: 0, history: [] })
const currentMonth = ref(new Date())

// 新奖励表单
const newReward = ref({ name: '', price: '' })

// 测试配置
const configLoading = ref(false)
const configSaving = ref(false)
const configSaveMsg = ref('')
const configSaveMsgType = ref('success')
const configForm = ref({
  fillBlankHideRatio: 40,
  dailyLimit: 15,
  intervals: [0, 1, 3],
  stageNames: ['Day 0 首学', 'Day 1 复习1', 'Day 3 毕业考']
})
const quizLevels = ref([
  { spelling: 0, fillBlank: 5, choice: 10, passRate: 100 },
  { spelling: 0, fillBlank: 6, choice: 9, passRate: 100 },
  { spelling: 0, fillBlank: 8, choice: 7, passRate: 100 }
])

// 备份/撤销
const hasBackup = ref(false)
const restoring = ref(false)
const showRestoreConfirm = ref(false)
const restoreResult = ref('')

// 单词扩充配置
const expansionLoading = ref(false)
const expansionSaving = ref(false)
const expansionSaveMsg = ref('')
const expansionSaveMsgType = ref('success')
const expansionForm = ref({
  batchSize: 20,
  intervalDays: 3,
  skipB2Plus: true // legacy, not used
})
const ratioA1 = ref(20)
const ratioA2 = ref(40)
const ratioB1 = ref(40)
const expansionStatus = ref({
  totalAdded: 0,
  progress: { A1: 0, A2: 0, B1: 0 },
  lastExpansion: '',
  nextExpansion: ''
})

const ratioTotal = computed(() => ratioA1.value + ratioA2.value + ratioB1.value)

// 计算属性
const currentPoints = computed(() => pointsData.value.points || 0)
const pointsHistory = computed(() => pointsData.value.history || [])
const totalEarned = computed(() => {
  return pointsHistory.value
    .filter(r => r.points > 0)
    .reduce((sum, r) => sum + r.points, 0)
})
const totalSpent = computed(() => {
  return Math.abs(pointsHistory.value
    .filter(r => r.points < 0)
    .reduce((sum, r) => sum + r.points, 0))
})

const calendarTitle = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth() + 1
  return `${year}年${month}月`
})

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  const days = []
  // 填充月初空白
  for (let i = 0; i < firstDay; i++) {
    days.push({ date: null })
  }
  // 填充日期
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      date: d,
      dateStr,
      count: calendarData.value[dateStr] || 0
    })
  }
  return days
})

// 方法
async function verifyPassword() {
  try {
    const res = await shopApi.verifyParent(password.value)
    if (res.valid) {
      verified.value = true
      errorMsg.value = ''
      loadData()
    } else {
      errorMsg.value = '密码错误，请重试'
    }
  } catch (e) {
    errorMsg.value = '验证失败，请重试'
  }
}

function logout() {
  verified.value = false
  password.value = ''
}

async function loadData() {
  try {
    // 加载测试配置
    loadConfig()
    
    // 加载扩充配置
    loadExpansionConfig()
    
    // 加载日历数据
    const calRes = await statsApi.getCalendar()
    if (calRes.success) {
      calendarData.value = calRes.data || {}
    }
    
    // 加载薄弱单词
    const weakRes = await statsApi.getWeakWords()
    if (weakRes.success) {
      weakWords.value = (weakRes.data || []).slice(0, 10)
    }
    
    // 加载积分数据
    const pointsRes = await pointsApi.getPoints()
    if (pointsRes.success) {
      pointsData.value = pointsRes.data || { points: 0, history: [] }
    }
    
    // 加载商店数据获取现实奖励
    const shopRes = await shopApi.getShopData()
    if (shopRes.success && shopRes.data.realRewards) {
      realRewards.value = shopRes.data.realRewards || []
    }
    
    // 加载备份状态
    try {
      const backupRes = await backupApi.status()
      if (backupRes.success) {
        hasBackup.value = backupRes.data.hasBackup
      }
    } catch (e) {
      console.error('加载备份状态失败:', e)
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  }
}

async function addReward() {
  if (!newReward.value.name || !newReward.value.price) return
  
  try {
    const res = await shopApi.addRealReward(
      newReward.value.name, 
      newReward.value.price, 
      password.value
    )
    if (res.success) {
      newReward.value = { name: '', price: '' }
      // 重新加载奖励列表
      const shopRes = await shopApi.getShopData()
      if (shopRes.success && shopRes.data.realRewards) {
        realRewards.value = shopRes.data.realRewards
      }
    }
  } catch (e) {
    console.error('添加奖励失败:', e)
  }
}

function confirmRestore() {
  showRestoreConfirm.value = true
  restoreResult.value = ''
}

async function doRestore() {
  restoring.value = true
  try {
    const res = await backupApi.restore()
    if (res.success && res.data.restored) {
      restoreResult.value = '✅ ' + res.data.message
      hasBackup.value = false
      // 重新加载数据
      await loadData()
    } else {
      restoreResult.value = '❌ ' + (res.data?.message || '还原失败')
    }
  } catch (e) {
    restoreResult.value = '❌ 操作失败: ' + e.message
  } finally {
    restoring.value = false
    showRestoreConfirm.value = false
  }
}

function cancelRestore() {
  showRestoreConfirm.value = false
}

function prevMonth() {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() - 1)
  currentMonth.value = d
}

function nextMonth() {
  const d = new Date(currentMonth.value)
  d.setMonth(d.getMonth() + 1)
  currentMonth.value = d
}

function getDayClass(day) {
  if (!day.date) return 'empty'
  if (day.count === 0) return 'level-0'
  if (day.count <= 10) return 'level-1'
  if (day.count <= 30) return 'level-2'
  return 'level-3'
}

function getDayTitle(day) {
  if (!day.date) return ''
  return `${day.dateStr}: 复习了 ${day.count} 个单词`
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const month = d.getMonth() + 1
  const date = d.getDate()
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${date} ${hour}:${min}`
}

async function loadConfig() {
  configLoading.value = true
  try {
    const res = await axios.get('/api/config')
    const cfg = res.data.data || res.data
    if (cfg.quizConfig) {
      quizLevels.value = [0, 1, 2].map(i => {
        const level = cfg.quizConfig[String(i)] || {}
        return {
          spelling: level.spelling || 0,
          fillBlank: level.fillBlank || 0,
          choice: level.choice || 0,
          passRate: Math.round((level.passRate || 1) * 100)
        }
      })
    }
    configForm.value.fillBlankHideRatio = Math.round((cfg.fillBlankHideRatio || 0.4) * 100)
    configForm.value.dailyLimit = cfg.dailyLimit || 15
    configForm.value.intervals = cfg.intervals || [0, 1, 3]
    configForm.value.stageNames = cfg.stageNames || ['Day 0 首学', 'Day 1 复习1', 'Day 3 毕业考']
  } catch (e) {
    console.error('加载配置失败:', e)
  } finally {
    configLoading.value = false
  }
}

async function saveConfig() {
  configSaving.value = true
  configSaveMsg.value = ''
  try {
    const quizConfig = {}
    quizLevels.value.forEach((level, i) => {
      quizConfig[String(i)] = {
        spelling: level.spelling,
        fillBlank: level.fillBlank,
        choice: level.choice,
        passRate: level.passRate / 100
      }
    })
    await axios.put('/api/config', {
      quizConfig,
      fillBlankHideRatio: configForm.value.fillBlankHideRatio / 100,
      dailyLimit: configForm.value.dailyLimit,
      intervals: configForm.value.intervals,
      stageNames: configForm.value.stageNames
    })
    configSaveMsg.value = '✅ 保存成功'
    configSaveMsgType.value = 'success'
    setTimeout(() => { configSaveMsg.value = '' }, 3000)
  } catch (e) {
    configSaveMsg.value = '❌ 保存失败: ' + e.message
    configSaveMsgType.value = 'error'
  } finally {
    configSaving.value = false
  }
}

async function loadExpansionConfig() {
  expansionLoading.value = true
  try {
    // Load config from quiz-config
    const cfgRes = await axios.get('/api/config')
    const cfg = cfgRes.data.data || cfgRes.data
    if (cfg.expansionConfig) {
      expansionForm.value.batchSize = cfg.expansionConfig.batchSize || 20
      expansionForm.value.intervalDays = cfg.expansionConfig.intervalDays || 3
      expansionForm.value.skipB2Plus = cfg.expansionConfig.skipB2Plus !== false
      ratioA1.value = Math.round((cfg.expansionConfig.ratio?.A1 || 0.2) * 100)
      ratioA2.value = Math.round((cfg.expansionConfig.ratio?.A2 || 0.4) * 100)
      ratioB1.value = Math.round((cfg.expansionConfig.ratio?.B1 || 0.4) * 100)
    }
    // Load expansion status/progress
    const statusRes = await axios.get('/api/expansion/status')
    if (statusRes.data.success) {
      expansionStatus.value = statusRes.data.data
    }
  } catch (e) {
    console.error('加载扩充配置失败:', e)
  } finally {
    expansionLoading.value = false
  }
}

async function saveExpansionConfig() {
  if (ratioTotal.value !== 100) return
  expansionSaving.value = true
  expansionSaveMsg.value = ''
  try {
    await axios.put('/api/config', {
      expansionConfig: {
        batchSize: expansionForm.value.batchSize,
        intervalDays: expansionForm.value.intervalDays,
        ratio: {
          A1: ratioA1.value / 100,
          A2: ratioA2.value / 100,
          B1: ratioB1.value / 100
        }
      }
    })
    expansionSaveMsg.value = '✅ 保存成功'
    expansionSaveMsgType.value = 'success'
    setTimeout(() => { expansionSaveMsg.value = '' }, 3000)
  } catch (e) {
    expansionSaveMsg.value = '❌ 保存失败: ' + e.message
    expansionSaveMsgType.value = 'error'
  } finally {
    expansionSaving.value = false
  }
}
</script>

<style scoped>
.parent-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 密码验证界面 */
.password-gate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.gate-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 360px;
  width: 100%;
}

.gate-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.gate-card h2 {
  color: #1E3A5F;
  margin: 0 0 8px 0;
  font-size: 24px;
}

.gate-card p {
  color: #666;
  margin: 0 0 24px 0;
}

.password-input-wrapper {
  margin-bottom: 16px;
}

.password-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e6ed;
  border-radius: 12px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.password-input:focus {
  outline: none;
  border-color: #5DADE2;
}

.error-msg {
  color: #E74C3C;
  font-size: 14px;
  margin-bottom: 16px;
}

.gate-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 通用按钮 */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #5DADE2 0%, #2E6B8A 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(93, 173, 226, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-logout {
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
  padding: 8px 16px;
  font-size: 14px;
}

.btn-logout:hover {
  background: #f5f5f5;
}

.btn-icon {
  background: #f0f0f0;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 8px;
  font-size: 18px;
}

.btn-icon:hover {
  background: #e0e0e0;
}

/* 家长中心内容 */
.parent-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  padding-bottom: 100px;
}

.parent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 16px 24px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.parent-header h1 {
  margin: 0;
  font-size: 22px;
  color: #1E3A5F;
}

/* 区块样式 */
.section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #1E3A5F;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 12px;
}

/* 日历 */
.calendar-container {
  width: 100%;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calendar-month {
  font-size: 18px;
  font-weight: 600;
  color: #1E3A5F;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  color: #888;
  font-size: 14px;
  margin-bottom: 8px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border-radius: 8px;
  cursor: default;
}

.calendar-day.empty {
  background: transparent;
}

.calendar-day.level-0 {
  background: #f0f0f0;
  color: #999;
}

.calendar-day.level-1 {
  background: #d4edda;
  color: #155724;
}

.calendar-day.level-2 {
  background: #76D7C4;
  color: #155724;
}

.calendar-day.level-3 {
  background: #48C9B0;
  color: white;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  font-size: 12px;
  color: #666;
}

.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 4px;
  vertical-align: middle;
}

.legend-dot.level-0 { background: #f0f0f0; }
.legend-dot.level-1 { background: #d4edda; }
.legend-dot.level-2 { background: #76D7C4; }
.legend-dot.level-3 { background: #48C9B0; }

/* 薄弱单词 */
.weak-words-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weak-word-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff9f5;
  border-radius: 10px;
  border-left: 3px solid #FF7F50;
}

.word-rank {
  font-weight: 600;
  color: #FF7F50;
  min-width: 30px;
}

.word-text {
  font-weight: 500;
  color: #1E3A5F;
  min-width: 100px;
}

.word-meaning {
  flex: 1;
  color: #666;
  font-size: 14px;
}

.word-errors {
  color: #E74C3C;
  font-size: 13px;
  background: #ffeae8;
  padding: 4px 8px;
  border-radius: 12px;
}

/* 奖励管理 */
.reward-form {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.form-input {
  flex: 1;
  min-width: 150px;
  padding: 12px 16px;
  border: 2px solid #e0e6ed;
  border-radius: 10px;
  font-size: 14px;
}

.form-input.small {
  max-width: 120px;
  min-width: 100px;
}

.form-input:focus {
  outline: none;
  border-color: #5DADE2;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
}

.reward-icon {
  font-size: 24px;
}

.reward-name {
  flex: 1;
  font-weight: 500;
  color: #1E3A5F;
}

.reward-price {
  color: #F39C12;
  font-weight: 600;
}

.reward-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
}

.reward-status.available {
  background: #d4edda;
  color: #155724;
}

.reward-status.redeemed {
  background: #f0f0f0;
  color: #666;
}

/* 积分历史 */
.points-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFE4B5 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.points-current {
  display: flex;
  flex-direction: column;
}

.points-label {
  font-size: 13px;
  color: #888;
}

.points-value {
  font-size: 32px;
  font-weight: bold;
  color: #F39C12;
}

.points-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #666;
  text-align: right;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
}

.history-item.earned {
  background: #f0fff4;
}

.history-item.spent {
  background: #fff5f5;
}

.history-time {
  color: #999;
  font-size: 12px;
  min-width: 80px;
}

.history-action {
  flex: 1;
  color: #333;
}

.history-points {
  font-weight: 600;
}

.history-item.earned .history-points {
  color: #48C9B0;
}

.history-item.spent .history-points {
  color: #E74C3C;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state.small {
  padding: 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

/* 撤销区域 */
.section-desc {
  color: #666;
  font-size: 14px;
  margin: 0 0 16px 0;
}

.btn-danger {
  background: linear-gradient(135deg, #FF6B6B 0%, #E74C3C 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}

.confirm-box {
  background: #fff5f5;
  border: 1px solid #ffcccc;
  border-radius: 12px;
  padding: 20px;
}

.confirm-text {
  color: #E74C3C;
  font-weight: 500;
  margin: 0 0 16px 0;
}

.confirm-buttons {
  display: flex;
  gap: 12px;
}

.restore-result {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #f0fff4;
  color: #155724;
  font-weight: 500;
}

/* 测试配置 */
.config-subtitle {
  font-size: 15px;
  color: #1E3A5F;
  margin: 16px 0 10px 0;
  font-weight: 600;
}

.config-subtitle:first-of-type {
  margin-top: 0;
}

.quiz-config-table {
  border: 1px solid #e8ecf0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

.quiz-config-header,
.quiz-config-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.2fr;
  align-items: center;
  padding: 10px 14px;
  gap: 8px;
}

.quiz-config-header {
  background: #f5f7fa;
  font-weight: 600;
  font-size: 13px;
  color: #555;
  border-bottom: 1px solid #e8ecf0;
}

.quiz-config-row {
  border-bottom: 1px solid #f0f0f0;
}

.quiz-config-row:last-child {
  border-bottom: none;
}

.col-stage {
  font-weight: 500;
  color: #1E3A5F;
  font-size: 13px;
}

.col-num, .col-rate {
  text-align: center;
}

.total-count {
  font-weight: 600;
  color: #5DADE2;
  font-size: 15px;
}

.config-input {
  width: 52px;
  padding: 6px 4px;
  border: 1.5px solid #e0e6ed;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  transition: border-color 0.2s;
}

.config-input:focus {
  outline: none;
  border-color: #5DADE2;
}

.config-input.wide {
  width: 72px;
}

.config-input.tiny {
  width: 42px;
  padding: 4px 2px;
}

.unit {
  color: #888;
  font-size: 13px;
  margin-left: 4px;
}

.config-params {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.config-param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.config-param-row label {
  font-weight: 500;
  color: #1E3A5F;
  font-size: 14px;
  min-width: 120px;
}

.param-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-slider {
  width: 120px;
  accent-color: #5DADE2;
}

.param-value {
  font-weight: 600;
  color: #5DADE2;
  min-width: 40px;
  text-align: right;
}

.interval-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f0f5ff;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 13px;
  color: #1E3A5F;
  margin-right: 6px;
}

.config-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-save-msg {
  font-size: 14px;
  font-weight: 500;
}

.config-save-msg.success {
  color: #27ae60;
}

.config-save-msg.error {
  color: #E74C3C;
}

/* 响应式 */
@media (max-width: 640px) {
  .parent-content {
    padding: 12px;
  }
  
  .section {
    padding: 16px;
  }
  
  .reward-form {
    flex-direction: column;
  }
  
  .form-input.small {
    max-width: none;
  }
  
  .weak-word-item {
    flex-wrap: wrap;
  }
  
  .word-meaning {
    width: 100%;
    margin-top: 4px;
  }
  
  .points-summary {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .points-stats {
    text-align: center;
  }

  .quiz-config-header,
  .quiz-config-row {
    font-size: 12px;
  }

  .config-input {
    width: 44px;
    padding: 4px;
  }

  .config-input.tiny {
    width: 36px;
  }
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 26px;
  transition: 0.3s;
}

.toggle-slider:before {
  content: '';
  position: absolute;
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #5DADE2;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.toggle-label {
  font-size: 14px;
  color: #666;
}

/* Ratio config */
.ratio-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.ratio-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ratio-row label {
  font-weight: 500;
  color: #1E3A5F;
  font-size: 14px;
  min-width: 120px;
}

.ratio-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ratio-total {
  text-align: center;
  padding: 8px 16px;
  border-radius: 8px;
  background: #f0fff4;
  color: #27ae60;
  font-weight: 600;
  font-size: 14px;
}

.ratio-total.ratio-error {
  background: #fff5f5;
  color: #E74C3C;
}

.ratio-warning {
  margin-left: 8px;
  font-weight: 500;
}

.ratio-ok {
  margin-left: 4px;
}

/* Expansion progress */
.expansion-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #e8ecf0;
}

.progress-item:last-child {
  border-bottom: none;
}

.progress-label {
  color: #666;
  font-size: 14px;
}

.progress-value {
  font-weight: 600;
  color: #1E3A5F;
  font-size: 14px;
}
</style>
