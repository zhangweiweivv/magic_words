<!-- client/src/views/CardsView.vue -->
<template>
  <div class="cards-page">
    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-state">
      <KittyMascot :size="100" mood="thinking" />
      <p>正在加载单词…</p>
    </div>

    <!-- 测试模式 -->
    <QuizMode 
      v-else-if="isReviewMode && showQuiz" 
      :words="reviewedWords"
      :reviewStage="currentReviewStage"
      @finish="$router.push('/')"
      @backToReview="backToReview"
    />

    <!-- 复习完成，准备测试 -->
    <div v-else-if="isReviewMode && reviewCompleted && !showQuiz" class="pre-quiz-state">
      <div class="celebration">
        <KittyMascot :size="140" mood="excited" :showCrown="true" />
        <h2>复习完成！</h2>
        <p>现在来测试一下学会了多少吧！</p>
        <DuoButton variant="primary" size="large" @click="startQuiz">
          开始测试
        </DuoButton>
      </div>
    </div>

    <!-- 没有单词需要复习 -->
    <div v-else-if="words.length === 0" class="empty-state">
      <div class="empty-icon">✨</div>
      <h2>太棒了！</h2>
      <p>今天的任务已经完成了</p>
      <DuoButton variant="primary" size="large" @click="$router.push('/')">
        返回首页
      </DuoButton>
    </div>

    <!-- 复习完毕庆祝界面 -->
    <div v-else-if="currentIndex >= words.length" class="complete-state">
      <div class="celebration">
        <KittyMascot :size="140" mood="excited" :showCrown="true" />
        <h2>全部学完了！</h2>
        <div class="stats-summary">
          <div class="stat-item correct">
            <span class="stat-icon">✅</span>
            <span class="number">{{ correctCount }}</span>
            <span class="label">记住</span>
          </div>
          <div class="stat-item wrong">
            <span class="stat-icon">📝</span>
            <span class="number">{{ wrongCount }}</span>
            <span class="label">待复习</span>
          </div>
          <div class="stat-item skipped">
            <span class="stat-icon">⏭️</span>
            <span class="number">{{ skippedCount }}</span>
            <span class="label">跳过</span>
          </div>
        </div>
        <div class="complete-actions">
          <DuoButton variant="primary" size="large" @click="restart">
            再来一轮
          </DuoButton>
          <DuoButton variant="secondary" size="large" @click="$router.push('/')">
            返回首页
          </DuoButton>
        </div>
      </div>
    </div>

    <!-- 正常复习界面 -->
    <div v-else class="review-area">
      <!-- 顶部进度条 -->
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">{{ currentIndex + 1 }} / {{ words.length }}</div>
      </div>

      <!-- 连击火焰 -->
      <div v-if="streak >= 2" class="streak-display">
        <span class="fire" :class="{ 'super': streak >= 5 }">
          {{ streak >= 5 ? '🔥🔥🔥' : streak >= 3 ? '🔥🔥' : '🔥' }}
        </span>
        <span class="streak-count">连续 {{ streak }} 个！</span>
      </div>

      <!-- 反馈区 -->
      <transition name="feedback">
        <div v-if="feedback" class="feedback-bubble" :class="feedbackType">
          <span class="feedback-emoji">{{ feedbackEmoji }}</span>
          <span class="feedback-text">{{ feedback }}</span>
        </div>
      </transition>

      <!-- 卡片区域 -->
      <div class="card-section">
        <WordCard 
          ref="cardRef" 
          :word="currentWord" 
          :showReviewButtons="isReviewMode"
          :cardSkin="equipped.cardSkin"
          @remembered="handleRemembered"
          @forgot="handleForgot"
        />
        
        <!-- 发音按钮 -->
        <button class="speak-btn" @click.stop="speakWord">
          🔊
        </button>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button
          class="nav-btn"
          @click="prevWord"
          :disabled="currentIndex === 0 && rememberedHistory.length === 0"
          aria-label="上一个"
        >←</button>
        <DuoButton variant="primary" size="large" class="primary-action" @click="handleRemembered">
          ⭐ 记住了！
        </DuoButton>
        <button
          class="nav-btn"
          @click="nextWord"
          :disabled="currentIndex >= words.length - 1"
          aria-label="下一个"
        >→</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { wordsApi } from '../api/words'
import { getTodayReview, recordReview } from '../api/review'
import { pointsApi } from '../api/points'
import { useRoute } from 'vue-router'
import WordCard from '../components/WordCard.vue'
import QuizMode from '../components/QuizMode.vue'
import DuoButton from '../components/duo/DuoButton.vue'
import KittyMascot from '../components/duo/KittyMascot.vue'
import { checkAndUnlockAchievements } from '../utils/achievementChecker'
import { useShopConfig } from '../composables/useShopConfig'

const { equipped } = useShopConfig()

const route = useRoute()

const words = ref([])
const currentIndex = ref(0)
const loading = ref(true)
const cardRef = ref(null)

// 复习模式状态
const isReviewMode = ref(false)
const reviewWords = ref([])
const reviewedWords = ref([])
const reviewCompleted = ref(false)
const showQuiz = ref(false)
const currentReviewStage = ref(0)

// 已记住历史栈（用于 Previous 回退）
const rememberedHistory = ref([])

// 统计
const correctCount = ref(0)
const wrongCount = ref(0)
const skippedCount = ref(0)
const streak = ref(0)

// 反馈
const feedback = ref('')
const feedbackType = ref('')
const feedbackEmoji = ref('')

// 鼓励语
const correctMessages = [
  '太棒了！',
  '真聪明！',
  '很厉害！',
  '继续保持！',
  '你真棒！',
  '完美！',
  '宝藏到手！',
  '探险成功！'
]

const wrongMessages = [
  '没关系，再记一遍！',
  '加油，下次一定行！',
  '不要气馁哦！',
  '多看几遍就记住了！',
  '这个宝藏有点难找！',
  '再探索一次吧！'
]

const streakMessages = [
  '连续2个正确！🔥',
  '连续3个！火力全开！🔥🔥',
  '连续4个！太强了！🔥🔥🔥',
  '连续5个！你是探险王！👑',
  '连续{n}个！无敌了！🌟'
]

const currentWord = computed(() => words.value[currentIndex.value] || {})

const progressPercent = computed(() => {
  if (words.value.length === 0) return 0
  return Math.round((currentIndex.value / words.value.length) * 100)
})

const shuffleArray = (array) => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const getRandomMessage = (messages) => {
  return messages[Math.floor(Math.random() * messages.length)]
}

const showFeedback = (message, type, emoji) => {
  feedback.value = message
  feedbackType.value = type
  feedbackEmoji.value = emoji
  setTimeout(() => {
    feedback.value = ''
  }, 1500)
}

const speakWord = () => {
  if (!currentWord.value.word) return
  const word = currentWord.value.word.toLowerCase().trim()
  // 使用有道词典的真人发音
  const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`
  const audio = new Audio(audioUrl)
  audio.play().catch(() => {
    // 如果有道失败，回退到浏览器语音合成
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  })
}

// 切到新单词时自动播放发音（含 next/prev/remembered/forgot 触发的换词）
watch(
  () => currentWord.value && currentWord.value.word,
  (newWord, oldWord) => {
    if (!newWord) return
    if (newWord === oldWord) return
    // 等卡片渲染完成、reset 翻面动画结束后再朗读
    nextTick(() => speakWord())
  }
)

const nextWord = () => {
  if (currentIndex.value < words.value.length - 1) {
    cardRef.value?.reset()
    currentIndex.value++
  }
}

const prevWord = () => {
  if (currentIndex.value > 0) {
    cardRef.value?.reset()
    currentIndex.value--
  } else if (rememberedHistory.value.length > 0) {
    // 回退：把最近记住的单词放回列表开头
    const last = rememberedHistory.value.pop()
    words.value.splice(0, 0, last.word)
    correctCount.value = Math.max(0, correctCount.value - 1)
    // 如果是复习模式，也要从 reviewedWords 移除
    if (isReviewMode.value && reviewedWords.value.length > 0) {
      const idx = reviewedWords.value.findIndex(w => w.word === last.word.word)
      if (idx >= 0) reviewedWords.value.splice(idx, 1)
    }
    cardRef.value?.reset()
    // currentIndex 保持 0，显示刚恢复的单词
  }
}

const restart = () => {
  words.value = shuffleArray(words.value)
  currentIndex.value = 0
  correctCount.value = 0
  wrongCount.value = 0
  skippedCount.value = 0
  streak.value = 0
  rememberedHistory.value = []
}

const handleRemembered = async () => {
  const word = currentWord.value
  if (!word) return
  
  try {
    // 翻卡只加积分，不推进艾宾浩斯进度（测试通过后才推进）
    correctCount.value++
    streak.value++
    
    await pointsApi.addPoints('记住单词', 1, word.word)
    
    if (isReviewMode.value) {
      // 复习模式：记录已复习的单词，用于后续测试
      reviewedWords.value.push({ ...word })
    }
    
    // 记录到历史栈（用于 Previous 回退）
    rememberedHistory.value.push({ word: { ...word }, index: currentIndex.value })
    
    // 从当前列表移除
    words.value.splice(currentIndex.value, 1)
    
    if (words.value.length === 0) {
      if (isReviewMode.value) {
        // 复习模式：进入测试
        reviewCompleted.value = true
        const newAchievements = await checkAndUnlockAchievements({ isFirstReview: true })
        if (newAchievements.length > 0) {
          console.log('解锁新成就:', newAchievements)
        }
      }
      // 非复习模式：会显示完成界面（currentIndex >= words.length）
    } else if (currentIndex.value >= words.value.length) {
      currentIndex.value = words.value.length - 1
    }
    
    if (streak.value >= 2) {
      showFeedback(streakMessages[Math.min(streak.value - 2, streakMessages.length - 1)].replace('{n}', streak.value), 'streak', '🔥')
    } else {
      showFeedback(getRandomMessage(correctMessages), 'correct', '😊')
    }
    
    cardRef.value?.reset()
  } catch (e) {
    console.error('记录复习结果失败:', e)
  }
}

const startQuiz = () => {
  if (reviewedWords.value.length > 0) {
    const firstWord = reviewedWords.value[0]
    const stage = Math.min(firstWord.reviewCount || 0, 2)
    currentReviewStage.value = stage
  }
  showQuiz.value = true
}

const backToReview = () => {
  // 返回复习模式：把已复习的单词重新放回待复习列表
  showQuiz.value = false
  reviewCompleted.value = false
  words.value = [...reviewedWords.value]
  reviewedWords.value = []
  currentIndex.value = 0
  correctCount.value = 0
  wrongCount.value = 0
  streak.value = 0
  rememberedHistory.value = []
}

const handleForgot = async () => {
  const word = currentWord.value
  if (!word) return
  
  try {
    // 记录复习（两种模式都记录）
    await recordReview(word.word, false)
    wrongCount.value++
    streak.value = 0
    
    // 把没记住的单词移到末尾，稍后再复习
    const currentWordItem = words.value.splice(currentIndex.value, 1)[0]
    words.value.push(currentWordItem)
    
    if (currentIndex.value >= words.value.length) {
      currentIndex.value = 0
    }
    
    showFeedback(getRandomMessage(wrongMessages), 'wrong', '💪')
    cardRef.value?.reset()
  } catch (e) {
    console.error('记录复习结果失败:', e)
  }
}

onMounted(async () => {
  try {
    if (route.query.mode === 'review') {
      isReviewMode.value = true
      try {
        const res = await getTodayReview()
        if (res.success) {
          // 今日任务已完成：直接显示"探索完毕"（words为空 + reviewCompleted保持false）
          // 而不是误触发"开始测试"界面
          if (res.data.todayCompleted) {
            words.value = []
            reviewWords.value = []
            // 不设置 reviewCompleted = true，这样会走到 words.length === 0 的分支
            // 显示"今天的海域已经探索完毕 🏝️"
          } else {
            reviewWords.value = res.data.words || []
            words.value = reviewWords.value
          }
        }
      } catch (e) {
        console.error('获取复习单词失败:', e)
      }
      loading.value = false
      return
    }
    
    const res = await wordsApi.getUnlearned()
    words.value = shuffleArray(res.data.data || res.data || [])
  } catch (e) {
    console.error('获取单词失败:', e)
    words.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.cards-page {
  min-height: 100vh;
  padding: 20px;
  padding-bottom: 180px;
  background: var(--duo-bg-soft);
  color: var(--duo-text);
  font-family: var(--duo-font-body);
  position: relative;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  color: var(--duo-text);
}

.loading-state p {
  margin-top: 20px;
  font-size: 16px;
  color: var(--duo-text-soft);
  font-weight: 700;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  color: var(--duo-text);
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-state h2 {
  font-family: var(--duo-font-display);
  font-size: 26px;
  margin-bottom: 10px;
  color: var(--duo-text);
  font-weight: 900;
}

.empty-state p {
  color: var(--duo-text-soft);
  margin-bottom: 24px;
  font-weight: 600;
}

/* 完成状态 */
.complete-state,
.pre-quiz-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  color: var(--duo-text);
}

.celebration {
  text-align: center;
  position: relative;
  z-index: 2;
}

.celebration h2 {
  font-family: var(--duo-font-display);
  font-size: 28px;
  margin: 16px 0 8px;
  color: var(--duo-green-dark);
  font-weight: 900;
}

.celebration p {
  color: var(--duo-text-soft);
  margin-bottom: 24px;
  font-weight: 600;
}

.stats-summary {
  display: flex;
  gap: 14px;
  margin: 30px 0;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--duo-bg);
  border: 2px solid var(--duo-border);
  box-shadow: 0 2px 0 var(--duo-border);
  padding: 14px 18px;
  border-radius: var(--duo-radius-lg);
  min-width: 80px;
}

.stat-item .stat-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.stat-item .number {
  font-size: 26px;
  font-weight: 900;
  color: var(--duo-text);
  font-family: var(--duo-font-display);
}

.stat-item .label {
  font-size: 11px;
  color: var(--duo-text-muted);
  margin-top: 2px;
  font-weight: 700;
}

.complete-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

/* 复习区域 */
.review-area {
  max-width: 400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

/* 进度条 */
.progress-section {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 16px;
  background: var(--duo-bg);
  border: 2px solid var(--duo-border);
  border-radius: var(--duo-radius-full);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--duo-green-light), var(--duo-green));
  border-radius: var(--duo-radius-full);
  transition: width 400ms ease;
}

.progress-text {
  font-size: 12px;
  font-weight: 800;
  color: var(--duo-text-soft);
  white-space: nowrap;
}

/* 连击显示 */
.streak-display {
  text-align: center;
  margin-bottom: 16px;
  animation: streak-pulse 0.5s ease-out;
}

@keyframes streak-pulse {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.fire {
  font-size: 32px;
  animation: fire-flicker 0.3s ease-in-out infinite;
}

.fire.super {
  font-size: 40px;
}

@keyframes fire-flicker {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.streak-count {
  display: block;
  color: var(--starfish);
  font-weight: bold;
  font-size: 16px;
  margin-top: 4px;
  text-shadow: 0 0 10px rgba(243, 156, 18, 0.5);
}

/* 反馈气泡 */
.feedback-bubble {
  text-align: center;
  padding: 12px 24px;
  border-radius: var(--radius-full);
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: bold;
  backdrop-filter: blur(10px);
}

.feedback-bubble.correct {
  background: var(--duo-green);
  color: white;
}

.feedback-bubble.wrong {
  background: var(--duo-red);
  color: white;
}

.feedback-bubble.streak {
  background: var(--duo-orange);
  color: white;
}

.feedback-emoji {
  margin-right: 8px;
}

.feedback-enter-active,
.feedback-leave-active {
  transition: all 0.3s ease;
}

.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

/* 卡片区域 */
.card-section {
  position: relative;
  margin-bottom: 30px;
}

.speak-btn {
  position: absolute;
  bottom: -25px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid var(--duo-border);
  background: var(--duo-bg);
  color: var(--duo-text);
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--duo-border);
  transition: transform 80ms ease, box-shadow 80ms ease;
}

.speak-btn:hover { background: var(--duo-bg-soft); }
.speak-btn:active { transform: translateY(4px); box-shadow: 0 0 0 var(--duo-border); }

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  padding: 20px 12px;
  flex-wrap: nowrap;
  max-width: 100%;
}
.action-buttons :deep(.primary-action) {
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
}
.nav-btn {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--duo-border);
  background: var(--duo-bg);
  color: var(--duo-text);
  font-size: 24px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 80ms ease, box-shadow 80ms ease, background 120ms ease;
  box-shadow: 0 4px 0 var(--duo-border);
}
.nav-btn:hover:not(:disabled) {
  background: var(--duo-bg-soft);
}
.nav-btn:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 0 0 var(--duo-border);
}
.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  box-shadow: none;
}
@media (max-width: 420px) {
  .action-buttons { gap: 10px; padding: 16px 8px; }
  .nav-btn { width: 48px; height: 48px; font-size: 20px; }
  .action-buttons :deep(.ocean-button.large) { padding: 14px 22px; font-size: 16px; }
}
</style>
