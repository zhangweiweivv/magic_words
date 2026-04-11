<template>
  <div class="weekly-exam">
    <BubbleBackground :count="6" />
    <WaveDecoration position="bottom" />

    <!-- 加载中 -->
    <div v-if="loading" class="state loading-state">
      <div class="state-icon">🧜‍♀️</div>
      <h2>正在准备本周考试...</h2>
      <p>请稍等片刻</p>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="state error-state">
      <div class="state-icon">⚓</div>
      <h2>加载失败</h2>
      <p class="error-text">{{ loadError }}</p>
      <div class="state-actions">
        <OceanButton variant="secondary" @click="goHome">返回港口</OceanButton>
        <OceanButton variant="primary" @click="fetchExam">重试</OceanButton>
      </div>
    </div>

    <!-- 本周暂无考试 -->
    <div v-else-if="stage === 'noExam'" class="state intro-state">
      <div class="state-icon">🌊</div>
      <h2>本周还没有考试哦</h2>
      <p class="subtitle">最近 {{ exam?.windowWeeks ?? '-' }} 周没有新毕业的单词，先去完成每日任务吧～</p>
      <div class="state-actions">
        <OceanButton variant="secondary" @click="goHome">返回港口</OceanButton>
        <OceanButton variant="primary" @click="fetchExam">刷新看看</OceanButton>
      </div>
    </div>

    <!-- 已完成（后端告诉 completed=true） -->
    <div v-else-if="stage === 'alreadyCompleted'" class="state result-state">
      <div class="state-icon">🏆</div>
      <h2>本周考试已完成！</h2>

      <div class="meta-card">
        <div class="meta-row"><span class="k">周期</span><span class="v">{{ formatDate(exam?.cycleDate) }}</span></div>
        <div class="meta-row"><span class="k">生成</span><span class="v">{{ formatDate(exam?.generatedDate) }}</span></div>
        <div class="meta-row"><span class="k">题量</span><span class="v">{{ exam?.total ?? 0 }} 题</span></div>
        <div class="meta-row"><span class="k">窗口</span><span class="v">近 {{ exam?.windowWeeks ?? '-' }} 周</span></div>
      </div>

      <div class="score-card">
        <div class="score-title">首轮成绩</div>
        <div class="score-value">{{ completedFirstRoundCorrect }} / {{ completedFirstRoundTotal }}</div>
        <div class="score-sub">正确率：{{ completedFirstRoundRate }}%</div>
      </div>

      <div v-if="completedRedoRounds.length" class="rounds-card">
        <div class="rounds-title">错题重做轮次</div>
        <div class="round" v-for="(r, idx) in completedRedoRounds" :key="idx">
          <div class="round-left">第 {{ idx + 1 }} 轮</div>
          <div class="round-right">✅ {{ r.correct }} / {{ r.correct + r.wrong }}（错 {{ r.wrong }}）</div>
        </div>
      </div>

      <div class="state-actions">
        <OceanButton variant="primary" size="large" @click="goHome">返回港口</OceanButton>
      </div>
    </div>

    <!-- 介绍页 -->
    <div v-else-if="stage === 'intro'" class="state intro-state">
      <div class="state-icon">📘</div>
      <h2>本周考试</h2>
      <p class="subtitle">用一小段时间，看看这周掌握得怎么样</p>

      <div class="meta-card">
        <div class="meta-row"><span class="k">周期</span><span class="v">{{ formatDate(exam?.cycleDate) }}</span></div>
        <div class="meta-row"><span class="k">生成</span><span class="v">{{ formatDate(exam?.generatedDate) }}</span></div>
        <div class="meta-row"><span class="k">题量</span><span class="v">{{ exam?.total ?? 0 }} 题</span></div>
        <div class="meta-row"><span class="k">窗口</span><span class="v">近 {{ exam?.windowWeeks ?? '-' }} 周</span></div>
      </div>

      <div class="state-actions">
        <OceanButton variant="secondary" @click="goHome">返回港口</OceanButton>
        <OceanButton variant="coral" size="large" @click="startFirstRound" :disabled="startingExam">
          {{ startingExam ? '准备中...' : '开始考试' }}
        </OceanButton>
      </div>
    </div>

    <!-- 首轮结果页（展示分数，并引导错题重做） -->
    <div v-else-if="stage === 'firstRoundResult'" class="state result-state">
      <div class="state-icon">🎯</div>
      <h2>首轮完成！</h2>

      <div class="score-card">
        <div class="score-title">首轮成绩</div>
        <div class="score-value">{{ firstRoundCorrect }} / {{ totalQuestions }}</div>
        <div class="score-sub">正确率：{{ firstRoundRate }}%</div>
      </div>

      <div v-if="firstRoundWrongCount > 0" class="hint-card">
        <div class="hint-title">还有 {{ firstRoundWrongCount }} 个小海怪需要再打一次！</div>
        <div class="hint-sub">接下来只重做错题，直到全部答对。</div>
      </div>

      <div class="state-actions">
        <OceanButton variant="secondary" @click="goHome">返回港口</OceanButton>
        <OceanButton
          v-if="firstRoundWrongCount > 0"
          variant="primary"
          size="large"
          @click="startRedo"
        >
          开始错题重做
        </OceanButton>
        <OceanButton
          v-else
          variant="success"
          size="large"
          @click="finishIfNoWrongs"
        >
          完成并返回
        </OceanButton>
      </div>
    </div>

    <!-- 完成页（包含 redo 完成后的结果） -->
    <div v-else-if="stage === 'completed'" class="state complete-state">
      <div class="state-icon">🎉</div>
      <h2>本周考试完成！</h2>
      <p class="subtitle">你把所有错题都打败啦～</p>

      <div class="score-card">
        <div class="score-title">首轮成绩（计分）</div>
        <div class="score-value">{{ firstRoundCorrect }} / {{ totalQuestions }}</div>
        <div class="score-sub">正确率：{{ firstRoundRate }}%</div>
      </div>

      <div v-if="roundsSummary.length" class="rounds-card">
        <div class="rounds-title">错题重做记录</div>
        <div class="round" v-for="r in roundsSummary" :key="r.roundIndex">
          <div class="round-left">第 {{ r.roundIndex }} 轮</div>
          <div class="round-right">✅ {{ r.correct }} / {{ r.correct + r.wrong }}（错 {{ r.wrong }}）</div>
        </div>
      </div>

      <div class="state-actions">
        <OceanButton variant="primary" size="large" @click="goHome">返回港口</OceanButton>
      </div>
    </div>

    <!-- 做题区域 -->
    <div v-else class="quiz-area">
      <div class="quiz-header">
        <div class="quiz-title">
          <span class="badge" :class="mode === 'redo' ? 'badge-redo' : 'badge-first'">
            {{ mode === 'redo' ? `错题重做 第 ${redoRoundIndex} 轮` : '首轮考试' }}
          </span>
        </div>

        <div class="quiz-progress">
          <el-progress
            :percentage="progressPercent"
            :stroke-width="12"
            :format="() => `${currentIndex + 1} / ${currentQuestions.length}`"
          />
        </div>
      </div>

      <transition name="fade">
        <div v-if="showFeedback" class="feedback" :class="feedbackType">
          {{ feedbackText }}
        </div>
      </transition>

      <!-- 选择题 -->
      <ChoiceQuestion
        v-if="currentQuestion?.type === 'choice'"
        :question="currentQuestion"
        :showAnswer="showAnswer"
        :isCorrect="isCorrect"
        ref="questionRef"
        @answer="handleAnswer"
      />

      <!-- 拼写补全题 -->
      <FillBlankQuestion
        v-else-if="currentQuestion?.type === 'fillBlank'"
        :question="currentQuestion"
        :showAnswer="showAnswer"
        :isCorrect="isCorrect"
        ref="questionRef"
        @answer="handleAnswer"
      />

      <!-- 完全拼写题 -->
      <SpellingQuestion
        v-else-if="currentQuestion?.type === 'spelling'"
        :question="currentQuestion"
        :showAnswer="showAnswer"
        :isCorrect="isCorrect"
        ref="questionRef"
        @answer="handleAnswer"
      />

      <!-- 下一题/完成 -->
      <el-button
        v-if="showAnswer"
        type="primary"
        size="large"
        class="next-btn"
        @click="nextQuestion"
      >
        {{ isLastQuestion ? (mode === 'redo' ? '结束本轮' : '首轮结束') : '下一题' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import BubbleBackground from '../components/ocean/BubbleBackground.vue'
import WaveDecoration from '../components/ocean/WaveDecoration.vue'
import OceanButton from '../components/ocean/OceanButton.vue'
import ChoiceQuestion from '../components/weekly-exam/ChoiceQuestion.vue'
import FillBlankQuestion from '../components/weekly-exam/FillBlankQuestion.vue'
import SpellingQuestion from '../components/weekly-exam/SpellingQuestion.vue'
import { weeklyExamApi } from '../api/weeklyExam'
import { useAudio } from '../composables/useAudio'
import { useEffects } from '../composables/useEffects'

const router = useRouter()

// 音效和特效（不涉及积分/复习/花园 API）
const { playSfx } = useAudio()
const { onCorrect, onWrong } = useEffects()

const loading = ref(true)
const loadError = ref('')
const exam = ref(null)
const startingExam = ref(false)
const questionRef = ref(null)

// localStorage key for redo persistence
const REDO_STORAGE_KEY = 'weekly-exam-redo-state'

// stage:
// - intro: 介绍页
// - inProgress: 做题中
// - firstRoundResult: 首轮结果
// - completed: 全部完成（含错题重做）
// - alreadyCompleted: 后端显示已完成
const stage = ref('intro')

// 做题状态
const mode = ref('first') // first | redo
const currentQuestions = ref([])
const currentIndex = ref(0)

// 反馈与答案状态
const showAnswer = ref(false)
const showFeedback = ref(false)
const feedbackType = ref('')
const feedbackText = ref('')
const isCorrect = ref(false)

// 计分（仅首轮）
const firstRoundCorrect = ref(0)
const wrongDetails = ref([]) // { word, meaning, type }
const wrongQueue = ref([]) // 错题题目对象列表，用于进入 redo

// redo 轮次记录
const redoRoundIndex = ref(1)
const roundsSummary = ref([]) // { roundIndex, correct, wrong, wrongWords }
const nextWrongQueue = ref([])
const currentRoundWrongWords = ref([])

const totalQuestions = computed(() => exam.value?.total ?? (exam.value?.questions?.length ?? 0))

const currentQuestion = computed(() => currentQuestions.value[currentIndex.value] || null)
const isLastQuestion = computed(() => currentIndex.value >= currentQuestions.value.length - 1)
const progressPercent = computed(() => {
  if (!currentQuestions.value.length) return 0
  // +1 so the last question can show 100%
  return Math.round(((currentIndex.value + 1) / currentQuestions.value.length) * 100)
})

const firstRoundWrongCount = computed(() => Math.max(0, totalQuestions.value - firstRoundCorrect.value))
const firstRoundRate = computed(() => {
  if (!totalQuestions.value) return 0
  return Math.round((firstRoundCorrect.value / totalQuestions.value) * 100)
})

// alreadyCompleted 页面：首轮成绩以后端记录为准（exam.rounds[0]），否则再 fallback
const completedFirstRoundTotal = computed(() => {
  const r0 = Array.isArray(exam.value?.rounds) ? exam.value.rounds[0] : null
  if (r0 && typeof r0.total === 'number') return r0.total
  return exam.value?.total || 0
})
const completedFirstRoundCorrect = computed(() => {
  const r0 = Array.isArray(exam.value?.rounds) ? exam.value.rounds[0] : null
  if (r0 && typeof r0.correct === 'number') return r0.correct
  return 0
})
const completedFirstRoundRate = computed(() => {
  const t = completedFirstRoundTotal.value
  if (!t) return 0
  return Math.round((completedFirstRoundCorrect.value / t) * 100)
})

const completedRedoRounds = computed(() => {
  return Array.isArray(exam.value?.roundsSummary) ? exam.value.roundsSummary : []
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return String(dateStr)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function goHome() {
  router.push('/')
}

async function fetchExam() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await weeklyExamApi.getCurrent()
    exam.value = res.data?.data ?? res.data

    if (!exam.value) {
      stage.value = 'intro'
      loadError.value = '后端返回为空，请稍后重试'
      return
    }

    // 本周没有可考试的单词（比如最近N周没有毕业词）
    if ((exam.value.total ?? 0) === 0 || !Array.isArray(exam.value.questions) || exam.value.questions.length === 0) {
      stage.value = 'noExam'
      return
    }

    // 后端 completed 优先
    if (exam.value.completed) {
      stage.value = 'alreadyCompleted'
    } else {
      stage.value = 'intro'
    }
  } catch (e) {
    loadError.value = e?.response?.data?.error || e?.response?.data?.message || e?.message || '网络错误'
  } finally {
    loading.value = false
  }
}

function resetQuestionState() {
  showAnswer.value = false
  isCorrect.value = false
  questionRef.value?.reset?.()
}

function startFirstRound() {
  startingExam.value = true
  mode.value = 'first'
  firstRoundCorrect.value = 0
  wrongDetails.value = []
  wrongQueue.value = []
  roundsSummary.value = []
  redoRoundIndex.value = 1
  nextWrongQueue.value = []
  currentRoundWrongWords.value = []

  currentQuestions.value = Array.isArray(exam.value?.questions) ? [...exam.value.questions] : []
  currentIndex.value = 0
  resetQuestionState()
  clearRedoStorage()
  stage.value = 'inProgress'
  startingExam.value = false
}

async function finishIfNoWrongs() {
  // 首轮全对：直接 complete
  clearRedoStorage()
  try {
    await weeklyExamApi.complete({
      generatedDate: exam.value?.generatedDate,
      rounds: []
    })
  } catch (e) {
    // complete 失败也不阻塞返回，但给用户反馈
    console.warn('weeklyExam complete failed:', e)
  }
  stage.value = 'completed'
}

function startRedo() {
  mode.value = 'redo'
  redoRoundIndex.value = 1
  roundsSummary.value = []

  currentQuestions.value = [...wrongQueue.value]
  currentIndex.value = 0

  nextWrongQueue.value = []
  currentRoundWrongWords.value = []
  resetQuestionState()
  saveRedoState()
  stage.value = 'inProgress'
}

// redo state localStorage persistence
function saveRedoState() {
  try {
    const state = {
      generatedDate: exam.value?.generatedDate,
      wrongQueue: wrongQueue.value,
      redoRoundIndex: redoRoundIndex.value,
      roundsSummary: roundsSummary.value,
      firstRoundCorrect: firstRoundCorrect.value,
      totalQuestions: totalQuestions.value,
    }
    localStorage.setItem(REDO_STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

function restoreRedoState(generatedDate) {
  try {
    const raw = localStorage.getItem(REDO_STORAGE_KEY)
    if (!raw) return false
    const state = JSON.parse(raw)
    if (state.generatedDate !== generatedDate) {
      clearRedoStorage()
      return false
    }
    wrongQueue.value = state.wrongQueue || []
    redoRoundIndex.value = state.redoRoundIndex || 1
    roundsSummary.value = state.roundsSummary || []
    firstRoundCorrect.value = state.firstRoundCorrect || 0
    return wrongQueue.value.length > 0
  } catch {
    return false
  }
}

function clearRedoStorage() {
  try { localStorage.removeItem(REDO_STORAGE_KEY) } catch { /* ignore */ }
}

// beforeunload warning during active redo
function onBeforeUnload(e) {
  if (stage.value === 'inProgress' && mode.value === 'redo') {
    e.preventDefault()
    e.returnValue = ''
  }
}

function showFeedbackMessage(text, type) {
  feedbackText.value = text
  feedbackType.value = type
  showFeedback.value = true
  setTimeout(() => {
    showFeedback.value = false
  }, 1500)
}

function recordCorrect() {
  if (mode.value === 'first') {
    firstRoundCorrect.value++
  }
}

function recordWrong() {
  // 首轮要记录 wrongDetails，并把题目加入 wrongQueue 供 redo
  if (mode.value === 'first') {
    wrongDetails.value.push({
      word: currentQuestion.value?.word,
      meaning: currentQuestion.value?.meaning,
      type: currentQuestion.value?.type,
    })
    wrongQueue.value.push({ ...currentQuestion.value })
  } else {
    // redo：将错题放入下一轮
    nextWrongQueue.value.push({ ...currentQuestion.value })
    if (currentQuestion.value?.word) currentRoundWrongWords.value.push(currentQuestion.value.word)
  }
}

function handleAnswer({ correct }) {
  showAnswer.value = true
  if (correct) {
    isCorrect.value = true
    playSfx('correct')
    onCorrect()
    recordCorrect()
    showFeedbackMessage('正确！', 'correct')
  } else {
    isCorrect.value = false
    playSfx('wrong')
    onWrong()
    recordWrong()
    showFeedbackMessage('错误，记住正确答案哦！', 'wrong')
  }
}

function nextQuestion() {
  // 重置显示状态
  resetQuestionState()

  if (currentIndex.value < currentQuestions.value.length - 1) {
    currentIndex.value++
    return
  }

  // 轮次结束
  endRound()
}

async function endRound() {
  // 首轮：提交首轮结果，进入首轮结果页
  if (mode.value === 'first') {
    try {
      await weeklyExamApi.submitFirstRound({
        generatedDate: exam.value?.generatedDate,
        total: totalQuestions.value,
        correct: firstRoundCorrect.value,
        wrongDetails: wrongDetails.value
      })
    } catch (e) {
      console.warn('weeklyExam submitFirstRound failed:', e)
      // 不中断流程，让用户继续错题重做/完成
    }

    stage.value = 'firstRoundResult'
    return
  }

  // redo：记录轮次 summary
  const wrongCount = nextWrongQueue.value.length
  const correctCount = Math.max(0, currentQuestions.value.length - wrongCount)
  const uniqWrongWords = Array.from(new Set(currentRoundWrongWords.value))

  roundsSummary.value.push({
    roundIndex: redoRoundIndex.value,
    correct: correctCount,
    wrong: wrongCount,
    wrongWords: uniqWrongWords
  })

  if (wrongCount > 0) {
    // 进入下一轮
    redoRoundIndex.value++
    currentQuestions.value = [...nextWrongQueue.value]
    currentIndex.value = 0
    nextWrongQueue.value = []
    currentRoundWrongWords.value = []
    resetQuestionState()
    saveRedoState()
    stage.value = 'inProgress'
    return
  }

  // redo 全部正确：complete
  clearRedoStorage()
  try {
    await weeklyExamApi.complete({
      generatedDate: exam.value?.generatedDate,
      rounds: roundsSummary.value
    })
  } catch (e) {
    console.warn('weeklyExam complete failed:', e)
  }

  stage.value = 'completed'
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  fetchExam().then(() => {
    // Try to restore redo state if exam matches
    if (exam.value && !exam.value.completed && exam.value.firstRoundRecorded) {
      const restored = restoreRedoState(exam.value.generatedDate)
      if (restored) {
        // Resume redo from where we left off
        mode.value = 'redo'
        currentQuestions.value = [...wrongQueue.value]
        currentIndex.value = 0
        nextWrongQueue.value = []
        currentRoundWrongWords.value = []
        resetQuestionState()
        stage.value = 'inProgress'
      }
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<style scoped>
.weekly-exam {
  min-height: 100vh;
  background: var(--bg-gradient, var(--gradient-ocean));
  position: relative;
  overflow: hidden;
}

.state {
  position: relative;
  z-index: 2;
  max-width: 520px;
  margin: 0 auto;
  padding: 40px 20px 180px;
  text-align: center;
}

.state-icon {
  font-size: 72px;
  margin: 10px 0 16px;
  filter: drop-shadow(0 6px 18px rgba(30, 58, 95, 0.25));
}

.state h2 {
  color: var(--pearl);
  font-family: var(--font-display);
  font-size: 34px;
  text-shadow: 2px 2px 4px rgba(30, 58, 95, 0.3);
  margin-bottom: 10px;
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  margin-bottom: 20px;
}

.error-text {
  color: rgba(255, 255, 255, 0.95);
  opacity: 0.95;
}

.meta-card,
.score-card,
.hint-card,
.rounds-card {
  margin: 18px auto;
  background: rgba(255, 255, 255, 0.92);
  border-radius: var(--radius-lg);
  padding: 18px 16px;
  box-shadow: var(--shadow-md);
  text-align: left;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(46, 107, 138, 0.2);
}

.meta-row:last-child {
  border-bottom: none;
}

.meta-row .k {
  color: var(--ocean-medium);
  font-weight: 600;
}

.meta-row .v {
  color: var(--ocean-deep);
  font-weight: 700;
}

.score-title {
  color: var(--ocean-medium);
  font-weight: 700;
  margin-bottom: 10px;
}

.score-value {
  font-size: 36px;
  font-family: var(--font-display);
  color: var(--ocean-deep);
}

.score-sub {
  color: var(--ocean-medium);
  margin-top: 6px;
}

.hint-title {
  color: var(--ocean-deep);
  font-weight: 700;
}

.hint-sub {
  color: var(--ocean-medium);
  margin-top: 6px;
}

.rounds-title {
  color: var(--ocean-deep);
  font-weight: 800;
  margin-bottom: 10px;
}

.round {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid rgba(46, 107, 138, 0.12);
}

.round:first-of-type {
  border-top: none;
}

.round-left {
  color: var(--ocean-medium);
  font-weight: 700;
}

.round-right {
  color: var(--ocean-deep);
  font-weight: 700;
}

.state-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px;
}

/* quiz area */
.quiz-area {
  position: relative;
  z-index: 2;
  max-width: 440px;
  margin: 0 auto;
  padding: 30px 20px 180px;
}

.quiz-header {
  margin-bottom: 18px;
}

.quiz-title {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.badge {
  display: inline-block;
  padding: 8px 14px;
  border-radius: var(--radius-full);
  font-weight: 800;
  letter-spacing: 0.5px;
  box-shadow: var(--shadow-md);
}

.badge-first {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.badge-redo {
  background: rgba(255, 127, 80, 0.2);
  color: white;
}

.quiz-progress {
  background: rgba(255, 255, 255, 0.88);
  padding: 12px 14px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

/* feedback */
.feedback {
  text-align: center;
  padding: 12px 24px;
  border-radius: 20px;
  margin: 16px 0;
  font-size: 18px;
  font-weight: bold;
}

.feedback.correct {
  background: linear-gradient(135deg, #95e1a3 0%, #67c23a 100%);
  color: white;
}

.feedback.wrong {
  background: linear-gradient(135deg, #fab6b6 0%, #f56c6c 100%);
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* question blocks - styles now in sub-components */

.next-btn {
  width: 100%;
  margin-top: 24px;
  height: 50px;
  font-size: 18px;
  border-radius: 25px;
}
</style>
