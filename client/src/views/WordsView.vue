<template>
  <div class="words-page">
    <div class="page-header">
      <h2>📚 单词列表</h2>
      <el-button @click="$router.push('/')" type="info" plain>
        ← 返回首页
      </el-button>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar" v-if="stats">
      <el-tag type="info" size="large">全部: {{ stats.total }}</el-tag>
      <el-tag type="warning" size="large">待学习: {{ stats.unlearned }}</el-tag>
      <el-tag type="success" size="large">已掌握: {{ stats.learned }}</el-tag>
    </div>

    <!-- 筛选器和搜索 -->
    <div class="filter-bar">
      <el-radio-group v-model="filter" @change="handleFilterChange">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="unlearned">待学习</el-radio-button>
        <el-radio-button value="learned">已掌握</el-radio-button>
      </el-radio-group>
      
      <el-input
        v-model="searchQuery"
        placeholder="搜索单词或释义..."
        :prefix-icon="Search"
        clearable
        class="search-input"
      />
    </div>

    <!-- 单词表格 -->
    <el-table
      v-loading="loading"
      :data="filteredWords"
      stripe
      style="width: 100%"
      empty-text="暂无单词"
    >
      <el-table-column label="Emoji" width="80" align="center">
        <template #default="{ row }">
          <span class="emoji">{{ row.emoji || '📝' }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="单词" min-width="150">
        <template #default="{ row }">
          <span class="word-text">{{ row.word }}</span>
          <el-button
            type="primary"
            :icon="Microphone"
            circle
            size="small"
            @click="speak(row.word)"
            class="speak-btn"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="释义" prop="meaning" min-width="200" />
      
      <el-table-column label="主题" width="120" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.theme" type="primary" size="small">
            {{ row.theme }}
          </el-tag>
          <span v-else class="no-theme">-</span>
        </template>
      </el-table-column>
      
      <el-table-column label="复习状态" width="160" align="center">
        <template #default="{ row }">
          <div class="review-status">
            <span class="stage-label" :class="stageClass(row)">
              {{ stageIcon(row) }} {{ stageText(row) }}
            </span>
            <div v-if="row.nextReviewDate && row.reviewStage !== '已毕业' && row.reviewStage !== '新词'" 
                 class="next-review" :class="{ overdue: isOverdue(row), 'due-today': isDueToday(row) }">
              {{ nextReviewLabel(row) }}
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 无数据提示 -->
    <div v-if="!loading && filteredWords.length === 0 && searchQuery" class="no-results">
      没有找到匹配的单词
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Microphone } from '@element-plus/icons-vue'
import wordsApi from '../api/words'

const route = useRoute()

// 状态
const loading = ref(false)
const words = ref([])
const stats = ref(null)
// 从 URL 参数读取初始筛选值，默认为 'all'
const filter = ref(route.query.filter || 'all')
const searchQuery = ref('')

// 计算属性：根据搜索过滤单词
const filteredWords = computed(() => {
  if (!searchQuery.value) {
    return words.value
  }
  const query = searchQuery.value.toLowerCase()
  return words.value.filter(word => 
    word.word.toLowerCase().includes(query) ||
    (word.meaning && word.meaning.toLowerCase().includes(query))
  )
})

// 获取统计数据
async function fetchStats() {
  try {
    const { data } = await wordsApi.getStats()
    stats.value = data.data || data
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 获取单词列表
async function fetchWords() {
  loading.value = true
  try {
    let response
    switch (filter.value) {
      case 'unlearned':
        response = await wordsApi.getUnlearned()
        break
      case 'learned':
        response = await wordsApi.getLearned()
        break
      default:
        response = await wordsApi.getAll()
    }
    words.value = response.data.data || response.data
  } catch (error) {
    console.error('获取单词失败:', error)
    words.value = []
  } finally {
    loading.value = false
  }
}

// 筛选器变化
function handleFilterChange() {
  searchQuery.value = ''
  fetchWords()
}

// 发音功能（Web Speech API）
function speak(text) {
  if ('speechSynthesis' in window) {
    // 取消正在播放的语音
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.8 // 稍慢一点，适合学习
    window.speechSynthesis.speak(utterance)
  } else {
    console.warn('浏览器不支持语音合成')
  }
}

// 复习状态相关
function stageIcon(row) {
  const icons = {
    '新词': '🌱',
    'Day 0 首学': '📖',
    'Day 1 复习1': '🔄',
    'Day 3 毕业考': '🎓',
    '已毕业': '⭐'
  }
  return icons[row.reviewStage] || '📚'
}

function stageText(row) {
  const texts = {
    '新词': '新词',
    'Day 0 首学': '首学中',
    'Day 1 复习1': '复习1',
    'Day 3 毕业考': '毕业考',
    '已毕业': '已毕业'
  }
  return texts[row.reviewStage] || row.reviewStage || '待学习'
}

function stageClass(row) {
  const classes = {
    '新词': 'stage-new',
    'Day 0 首学': 'stage-learning',
    'Day 1 复习1': 'stage-review1',
    'Day 3 毕业考': 'stage-final',
    '已毕业': 'stage-graduated'
  }
  return classes[row.reviewStage] || ''
}

function isOverdue(row) {
  if (!row.nextReviewDate) return false
  const today = new Date().toISOString().slice(0, 10)
  return row.nextReviewDate < today
}

function isDueToday(row) {
  if (!row.nextReviewDate) return false
  const today = new Date().toISOString().slice(0, 10)
  return row.nextReviewDate === today
}

function nextReviewLabel(row) {
  if (!row.nextReviewDate) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next = new Date(row.nextReviewDate + 'T00:00:00')
  const diffDays = Math.round((next - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return `逾期${-diffDays}天`
  if (diffDays === 0) return '今天复习'
  if (diffDays === 1) return '明天复习'
  // 显示月/日
  const m = next.getMonth() + 1
  const d = next.getDate()
  return `${m}/${d} 复习`
}

// 初始化
onMounted(() => {
  fetchStats()
  fetchWords()
})
</script>

<style scoped>
.words-page {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.stats-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-input {
  width: 250px;
}

.emoji {
  font-size: 24px;
}

.word-text {
  font-weight: 600;
  font-size: 16px;
  margin-right: 8px;
}

.speak-btn {
  margin-left: 4px;
}

.status-icon {
  font-size: 20px;
  cursor: default;
}

.no-theme {
  color: #999;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #909399;
  font-size: 14px;
}

.review-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stage-label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.stage-new {
  color: #67c23a;
}

.stage-learning {
  color: #e6a23c;
}

.stage-review1 {
  color: #409eff;
}

.stage-final {
  color: #9b59b6;
}

.stage-graduated {
  color: #f7ba2a;
}

.next-review {
  font-size: 11px;
  color: #999;
}

.next-review.overdue {
  color: #f56c6c;
  font-weight: 600;
}

.next-review.due-today {
  color: #e6a23c;
  font-weight: 600;
}

@media (max-width: 600px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
}
</style>
