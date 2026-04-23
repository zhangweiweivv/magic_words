<!-- client/src/views/CardsView.vue -->
<template>
  <div class="cards-page">
    <!-- 海洋背景 -->
    <BubbleBackground :count="5" />
    
    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-dolphin">🐬</div>
      <p>正在潜入知识海洋...</p>
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
        <div class="treasure-chest">🎁</div>
        <h2>探险完成！</h2>
        <p>现在来测试一下收获的宝藏吧！</p>
        <OceanButton variant="coral" size="large" @click="startQuiz">
          开始测试
        </OceanButton>
      </div>
    </div>

    <!-- 没有单词需要复习 -->
    <div v-else-if="words.length === 0" class="empty-state">
      <div class="empty-icon">🏝️</div>
      <h2>太棒了！</h2>
      <p>今天的海域已经探索完毕</p>
      <OceanButton variant="primary" @click="$router.push('/')">
        返回港口
      </OceanButton>
    </div>

    <!-- 复习完毕庆祝界面 -->
    <div v-else-if="currentIndex >= words.length" class="complete-state">
      <div class="celebration">
        <div class="fireworks">🎆✨🎇</div>
        <div class="trophy">🏆</div>
        <h2>探险大成功！</h2>
        <div class="stats-summary">
          <div class="stat-item correct">
            <span class="stat-icon">💎</span>
            <span class="number">{{ correctCount }}</span>
            <span class="label">收集</span>
          </div>
          <div class="stat-item wrong">
            <span class="stat-icon">🐚</span>
            <span class="number">{{ wrongCount }}</span>
            <span class="label">待复习</span>
          </div>
          <div class="stat-item skipped">
            <span class="stat-icon">🌊</span>
            <span class="number">{{ skippedCount }}</span>
            <span class="label">跳过</span>
          </div>
        </div>
        <div class="complete-actions">
          <OceanButton variant="primary" size="large" @click="restart">
            再探险一次
          </OceanButton>
          <OceanButton variant="secondary" size="large" @click="$router.push('/')">
            返回港口
          </OceanButton>
        </div>
      </div>
    </div>

    <!-- 正常复习界面 -->
    <div v-else class="review-area">
      <!-- 顶部进度条 -->
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }">
            <span class="progress-fish">🐠</span>
          </div>
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

      <!-- 多多反馈区 -->
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
        <OceanButton variant="ghost" size="large" @click="prevWord" :disabled="currentIndex === 0 && rememberedHistory.length === 0">
          ⬅️ Previous
        </OceanButton>
        <OceanButton variant="success" size="large" @click="handleRemembered">
          ⭐ I remembered!
        </OceanButton>
        <OceanButton variant="ghost" size="large" @click="nextWord" :disabled="currentIndex >= words.length - 1">
          Next ➡️
        </OceanButton>
      </div>
    </div>
    
    <!-- 波浪装饰 -->
    <WaveDecoration position="bottom" />
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
import BubbleBackground from '../components/ocean/BubbleBackground.vue'
import WaveDecoration from '../components/ocean/WaveDecoration.vue'
import OceanButton from '../components/ocean/OceanButton.vue'
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
  background: var(--bg-gradient, var(--gradient-deep));
  position: relative;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  color: white;
}

.loading-dolphin {
  font-size: 64px;
  animation: dolphin-swim 2s ease-in-out infinite;
}

@keyframes dolphin-swim {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-15px) rotate(-10deg); }
  75% { transform: translateY(10px) rotate(10deg); }
}

.loading-state p {
  margin-top: 20px;
  font-size: 18px;
  opacity: 0.8;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  color: white;
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-state h2 {
  font-family: var(--font-display);
  font-size: 28px;
  margin-bottom: 10px;
}

.empty-state p {
  opacity: 0.8;
  margin-bottom: 30px;
}

/* 完成状态 */
.complete-state,
.pre-quiz-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  color: white;
}

.celebration {
  text-align: center;
  position: relative;
  z-index: 2;
}

.fireworks {
  font-size: 48px;
  animation: fireworks-bounce 0.5s ease infinite alternate;
}

@keyframes fireworks-bounce {
  from { transform: translateY(0) scale(1); }
  to { transform: translateY(-15px) scale(1.1); }
}

.trophy,
.treasure-chest {
  font-size: 100px;
  margin: 20px 0;
  animation: trophy-glow 2s ease-in-out infinite;
}

@keyframes trophy-glow {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5)); }
  50% { filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.8)); }
}

.celebration h2 {
  font-family: var(--font-display);
  font-size: 32px;
  margin-bottom: 10px;
}

.celebration p {
  opacity: 0.9;
  margin-bottom: 30px;
}

.stats-summary {
  display: flex;
  gap: 30px;
  margin: 30px 0;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 16px 24px;
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
}

.stat-item .stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.stat-item .number {
  font-size: 32px;
  font-weight: bold;
  font-family: var(--font-display);
}

.stat-item .label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.complete-actions {
  display: flex;
  gap: 16px;
  margin-top: 30px;
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
}

.progress-bar {
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  overflow: visible;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-seaweed);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
  position: relative;
}

.progress-fish {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  animation: fish-swim 1s ease-in-out infinite;
}

@keyframes fish-swim {
  0%, 100% { transform: translateY(-50%) scaleX(1); }
  50% { transform: translateY(-50%) scaleX(-1); }
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  color: white;
  font-size: 14px;
  opacity: 0.8;
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
  background: var(--gradient-seaweed);
  color: white;
}

.feedback-bubble.wrong {
  background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
  color: white;
}

.feedback-bubble.streak {
  background: linear-gradient(135deg, #F39C12 0%, #E67E22 100%);
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
  border: none;
  background: var(--foam);
  font-size: 24px;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.speak-btn:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-lg);
}

.speak-btn:active {
  transform: scale(0.95);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px 0;
}
</style>
