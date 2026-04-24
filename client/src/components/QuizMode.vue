<template>
  <div class="quiz-mode">
    <!-- 测试完成 -->
    <div v-if="quizCompleted" class="quiz-complete">
      <div class="complete-icon">{{ reviewStage === 2 ? '🏆' : '🎉' }}</div>
      <h2>{{ reviewStage === 2 ? '恭喜完全掌握！' : '测试通过！' }}</h2>
      <p>{{ reviewStage === 2 ? '这批单词已移到「已记住」' : '今日任务全部完成' }}</p>
      <div class="stats">
        <span>总轮次: {{ quizRounds.length }}</span>
        <span>总错题: {{ totalMistakes }}</span>
      </div>
      <div class="complete-buttons">
        <el-button type="primary" size="large" @click="$emit('finish')">
          返回首页
        </el-button>
        <el-button type="default" size="large" @click="retryQuiz">
          🔄 再练一次
        </el-button>
      </div>
    </div>

    <!-- 测试进行中 -->
    <div v-else class="quiz-area">
      <!-- 进度 -->
      <div class="quiz-progress">
        <el-progress 
          :percentage="progressPercent" 
          :stroke-width="12"
          :format="() => `${currentIndex + 1} / ${questions.length}`"
        />
        <div class="quiz-info">
          <span v-if="quizRounds.length > 0" class="round-hint">
            第 {{ quizRounds.length + 1 }} 轮（剩 {{ questions.length }} 题）
          </span>
          <span v-else class="pass-rate-hint">
            需全部答对才能通过
          </span>
        </div>
      </div>

      <!-- 返回复习入口 -->
      <div class="back-to-review">
        <el-button text type="info" @click="$emit('backToReview')">
          ← 还没掌握？返回复习
        </el-button>
      </div>

      <!-- 反馈 -->
      <transition name="fade">
        <div v-if="showFeedback" class="feedback" :class="feedbackType">
          {{ feedbackText }}
        </div>
      </transition>

      <!-- 选择题 -->
      <div v-if="currentQuestion.type === 'choice'" class="choice-question">
        <div class="question-meaning">{{ currentQuestion.meaning }}</div>
        <div class="question-hint">选择正确的英文单词</div>
        <div class="options">
          <el-button
            v-for="(option, idx) in currentQuestion.options"
            :key="idx"
            class="option-btn"
            :class="{ 
              'selected': selectedOption === idx,
              'correct': showAnswer && idx === currentQuestion.correctIndex,
              'wrong': showAnswer && selectedOption === idx && idx !== currentQuestion.correctIndex
            }"
            :disabled="showAnswer"
            @click="selectOption(idx)"
          >
            {{ option }}
          </el-button>
        </div>
      </div>

      <!-- 拼写补全题 -->
      <div v-else-if="currentQuestion.type === 'fillBlank'" class="spelling-question">
        <div class="question-meaning">{{ currentQuestion.meaning }}</div>
        <div class="question-hint">填写缺失的字母</div>
        
        <!-- 交互式填空 -->
        <div
          class="fill-blank-letters"
          :style="{ '--letter-count': currentQuestion.letters.length }"
        >
          <template v-for="(letter, idx) in currentQuestion.letters" :key="idx">
            <span v-if="!letter.isBlank" class="letter-fixed">{{ letter.char }}</span>
            <input
              v-else
              type="text"
              maxlength="1"
              class="letter-input"
              :class="{ 
                'correct': showAnswer && fillBlankInputs[idx]?.toLowerCase() === letter.char.toLowerCase(),
                'wrong': showAnswer && fillBlankInputs[idx]?.toLowerCase() !== letter.char.toLowerCase()
              }"
              :disabled="showAnswer"
              :ref="el => { if (el) blankInputRefs[idx] = el }"
              v-model="fillBlankInputs[idx]"
              @input="onBlankInput(idx)"
              @keydown="onBlankKeydown($event, idx)"
            />
          </template>
        </div>
        
        <div v-if="showAnswer && !isCorrect" class="correct-answer">
          正确答案: {{ currentQuestion.word }}
        </div>
        <el-button 
          v-if="!showAnswer"
          type="primary" 
          size="large" 
          @click="checkFillBlank"
          :disabled="!allBlanksFilled"
        >
          确认
        </el-button>
      </div>

      <!-- 完全拼写题 -->
      <div v-else-if="currentQuestion.type === 'spelling'" class="spelling-question">
        <div class="question-meaning">{{ currentQuestion.meaning }}</div>
        <div class="question-hint">请拼写英文单词</div>
        <el-input
          v-model="spellingInput"
          class="spelling-input"
          size="large"
          :disabled="showAnswer"
          @keyup.enter="checkSpelling"
          placeholder="输入英文单词..."
        />
        <div v-if="showAnswer && !isCorrect" class="correct-answer">
          正确答案: {{ currentQuestion.word }}
        </div>
        <el-button 
          v-if="!showAnswer"
          type="primary" 
          size="large" 
          @click="checkSpelling"
          :disabled="!spellingInput.trim()"
        >
          确认
        </el-button>
      </div>

      <!-- 下一题按钮 -->
      <el-button 
        v-if="showAnswer"
        type="primary" 
        size="large" 
        class="next-btn"
        @click="nextQuestion"
      >
        {{ isLastQuestion ? '完成测试' : '下一题' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { wordsApi } from '../api/words'
import { pointsApi } from '../api/points'
import { statsApi } from '../api/stats'
import { completeQuiz, recordReview } from '../api/review'
import { checkAndUnlockAchievements } from '../utils/achievementChecker'
import { addResources } from '../api/garden'
import { useAudio } from '../composables/useAudio'
import { useEffects } from '../composables/useEffects'

// 音效和特效
const { playSfx } = useAudio()
const { onCorrect, onWrong } = useEffects()

const props = defineProps({
  words: {
    type: Array,
    required: true
  },
  reviewStage: {
    type: Number,
    default: 0  // 0=Day0, 1=Day1, 2=Day4（兼容旧调用）
  }
})

const emit = defineEmits(['finish', 'mastered', 'backToReview'])

// 测试配比：从后端配置加载，本地先用默认值
const DEFAULT_QUIZ_CONFIG = {
  0: { spelling: 0, fillBlank: 8, choice: 7, passRate: 1.00 },
  1: { spelling: 0, fillBlank: 8, choice: 7, passRate: 1.00 },
  2: { spelling: 0, fillBlank: 8, choice: 7, passRate: 1.00 }
}
const DEFAULT_FILL_BLANK_RATIO = 0.3

const QUIZ_CONFIG = ref(DEFAULT_QUIZ_CONFIG)
const fillBlankHideRatio = ref(DEFAULT_FILL_BLANK_RATIO)

// 从后端加载配置
import api from '../api/index'
async function loadConfig() {
  try {
    const { data } = await api.get('/config')
    if (data.success && data.data) {
      if (data.data.quizConfig) QUIZ_CONFIG.value = data.data.quizConfig
      if (data.data.fillBlankHideRatio != null) fillBlankHideRatio.value = data.data.fillBlankHideRatio
    }
  } catch (e) {
    console.log('Config load failed, using defaults')
  }
}
loadConfig()

// 状态
const questions = ref([])
const currentIndex = ref(0)
const correctCount = ref(0)  // 答对题数
const wrongQueue = ref([])  // 错题队列（Day 3 用）
const quizCompleted = ref(false)
const quizPassed = ref(false)  // 是否通过
const totalQuestions = ref(0)
const totalMistakes = ref(0)
const streak = ref(0)  // 连击计数
const totalEarnedPoints = ref(0)  // 本次测试获得的总积分
const hasEarnedPoints = ref(false)  // 是否已获得过积分（防止重试刷分）
const quizRounds = ref([])  // 累积所有轮次的测试数据
const currentRoundWrongs = ref([])  // 当前轮错题记录

// 当前题目状态
const selectedOption = ref(null)
const spellingInput = ref('')
const showAnswer = ref(false)
const showFeedback = ref(false)
const feedbackType = ref('')
const feedbackText = ref('')
const isCorrect = ref(false)

// 拼写补全状态
const fillBlankInputs = ref({})  // { index: 'a', ... }
const blankInputRefs = ref({})   // 输入框 refs

// 检查是否所有空格都已填写
const allBlanksFilled = computed(() => {
  if (!currentQuestion.value.letters) return false
  const blanks = currentQuestion.value.letters.filter(l => l.isBlank)
  return blanks.every(l => fillBlankInputs.value[l.index]?.trim())
})

// 计算属性
const currentQuestion = computed(() => questions.value[currentIndex.value] || {})
const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round(((currentIndex.value) / questions.value.length) * 100)
})
const isLastQuestion = computed(() => {
  return currentIndex.value >= questions.value.length - 1
})

// 生成题目
const generateQuestions = () => {
  let wordList = [...props.words]
  const result = []
  
  // 打乱单词顺序
  wordList = shuffleArray(wordList)
  
  // 整个批次的 reviewCount 相同，用 reviewStage 决定配比
  const stage = Math.min(props.reviewStage, 2)
  const config = QUIZ_CONFIG.value[stage] || QUIZ_CONFIG.value[0]
  const choiceCount = Math.min(config.choice, wordList.length)
  const fillBlankCount = Math.min(config.fillBlank || 0, wordList.length)
  const spellingCount = Math.min(config.spelling, wordList.length)
  
  let wordIdx = 0
  
  // 生成选择题
  for (let i = 0; i < choiceCount; i++) {
    const word = wordList[wordIdx % wordList.length]
    wordIdx++
    const optionData = generateOptions(word, wordList)
    result.push({
      type: 'choice',
      word: word.word,
      meaning: word.meaning,
      options: optionData.options,
      correctIndex: optionData.correctIndex
    })
  }
  
  // 生成拼写补全题
  for (let i = 0; i < fillBlankCount; i++) {
    const word = wordList[wordIdx % wordList.length]
    wordIdx++
    const fillData = generateFillBlankData(word.word)
    result.push({
      type: 'fillBlank',
      word: word.word,
      meaning: word.meaning,
      letters: fillData.letters,
      blankCount: fillData.blankCount
    })
  }
  
  // 生成完全拼写题
  for (let i = 0; i < spellingCount; i++) {
    const word = wordList[wordIdx % wordList.length]
    wordIdx++
    result.push({
      type: 'spelling',
      word: word.word,
      meaning: word.meaning
    })
  }
  
  // 打乱题目顺序
  const shuffledResult = shuffleArray(result)
  
  questions.value = shuffledResult
  totalQuestions.value = result.length
}

// 生成选择题选项（英文单词）
const generateOptions = (correctWord, allWords) => {
  const words = [correctWord.word]
  const otherWords = allWords.filter(w => w.word !== correctWord.word)
  
  // 随机选3个干扰项
  const shuffledOthers = shuffleArray(otherWords)
  for (let i = 0; i < 3 && i < shuffledOthers.length; i++) {
    words.push(shuffledOthers[i].word)
  }
  
  // 如果不够4个选项，用原有的
  while (words.length < 4 && words.length < allWords.length) {
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)]
    if (!words.includes(randomWord.word)) {
      words.push(randomWord.word)
    }
  }
  
  // 打乱选项并记录正确答案位置
  const correctAnswer = correctWord.word
  const shuffledWords = shuffleArray(words)
  const correctIndex = shuffledWords.indexOf(correctAnswer)
  
  return { options: shuffledWords, correctIndex }
}

// 生成拼写补全数据（隐藏字母，比例从配置读取，保留首字母）
const generateFillBlankData = (word) => {
  const letters = word.split('')
  const len = letters.length
  
  // 计算需要隐藏的数量（从配置读取比例）
  const hideCount = Math.max(1, Math.round(len * fillBlankHideRatio.value))
  
  // 可隐藏的位置（排除首字母）
  const candidates = []
  for (let i = 1; i < len; i++) {
    // 只隐藏字母，不隐藏空格或连字符
    if (/[a-zA-Z]/.test(letters[i])) {
      candidates.push(i)
    }
  }
  
  // 随机选择要隐藏的位置
  const shuffledCandidates = shuffleArray(candidates)
  const hidePositions = new Set(shuffledCandidates.slice(0, Math.min(hideCount, shuffledCandidates.length)))
  
  // 生成字母数组，每个位置标记是否为空
  const letterData = letters.map((ch, i) => ({
    char: ch,
    isBlank: hidePositions.has(i),
    index: i
  }))
  
  return {
    letters: letterData,
    blankCount: hidePositions.size
  }
}

// 打乱数组（不修改原数组）
const shuffleArray = (array) => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 选择选项
const selectOption = async (idx) => {
  selectedOption.value = idx
  showAnswer.value = true
  
  if (idx === currentQuestion.value.correctIndex) {
    isCorrect.value = true
    streak.value++
    
    // 播放正确音效和特效
    playSfx('correct')
    onCorrect()
    correctCount.value++
    
    // 选择题答对：2分 + 连击奖励
    const basePoints = 2
    const streakBonus = streak.value > 1 ? 1 : 0
    const points = basePoints + streakBonus
    if (!hasEarnedPoints.value) {
      totalEarnedPoints.value += points
      await pointsApi.addPoints('测试答对', points, currentQuestion.value.word)
    }
    
    showFeedbackMessage('正确！', 'correct')
  } else {
    isCorrect.value = false
    streak.value = 0
    totalMistakes.value++
    
    // 加入错题队列
    wrongQueue.value.push({ ...currentQuestion.value })
    
    // 播放错误音效和特效
    playSfx('wrong')
    onWrong()
    
    // 记录错题到薄弱单词统计
    statsApi.recordWordError(currentQuestion.value.word).catch(() => {})
    
    // 记录错题
    currentRoundWrongs.value.push({ word: currentQuestion.value.word, type: 'choice', correctAnswer: currentQuestion.value.options[currentQuestion.value.correctIndex] })
    
    showFeedbackMessage('错误，记住正确答案哦！', 'wrong')
  }
}

// 检查拼写补全
// 补全题输入处理
const onBlankInput = (idx) => {
  const val = fillBlankInputs.value[idx]
  if (val && val.length === 1) {
    // 自动跳到下一个空格
    const blanks = currentQuestion.value.letters
      .filter(l => l.isBlank)
      .map(l => l.index)
      .sort((a, b) => a - b)
    const currentPos = blanks.indexOf(idx)
    if (currentPos < blanks.length - 1) {
      const nextIdx = blanks[currentPos + 1]
      blankInputRefs.value[nextIdx]?.focus()
    }
  }
}

const onBlankKeydown = (e, idx) => {
  if (e.key === 'Backspace' && !fillBlankInputs.value[idx]) {
    // 空格时按退格，跳到上一个空格
    const blanks = currentQuestion.value.letters
      .filter(l => l.isBlank)
      .map(l => l.index)
      .sort((a, b) => a - b)
    const currentPos = blanks.indexOf(idx)
    if (currentPos > 0) {
      const prevIdx = blanks[currentPos - 1]
      blankInputRefs.value[prevIdx]?.focus()
    }
  } else if (e.key === 'Enter') {
    if (allBlanksFilled.value) {
      checkFillBlank()
    }
  }
}

// 检查拼写补全
const checkFillBlank = async () => {
  if (!allBlanksFilled.value) return
  
  showAnswer.value = true
  
  // 检查每个空格是否正确
  const blanks = currentQuestion.value.letters.filter(l => l.isBlank)
  const allCorrect = blanks.every(l => 
    fillBlankInputs.value[l.index]?.toLowerCase() === l.char.toLowerCase()
  )
  
  if (allCorrect) {
    isCorrect.value = true
    streak.value++
    correctCount.value++
    
    playSfx('correct')
    onCorrect()
    
    // 拼写补全答对：2分 + 连击奖励
    const basePoints = 2
    const streakBonus = streak.value > 1 ? 1 : 0
    const points = basePoints + streakBonus
    if (!hasEarnedPoints.value) {
      totalEarnedPoints.value += points
      await pointsApi.addPoints('测试答对', points, currentQuestion.value.word)
    }
    
    showFeedbackMessage('拼写正确！', 'correct')
  } else {
    isCorrect.value = false
    streak.value = 0
    totalMistakes.value++
    
    wrongQueue.value.push({ ...currentQuestion.value })
    
    // 记录错题到薄弱单词统计
    statsApi.recordWordError(currentQuestion.value.word).catch(() => {})
    
    // 记录错题
    currentRoundWrongs.value.push({ word: currentQuestion.value.word, type: 'fillBlank', correctAnswer: currentQuestion.value.word })
    
    playSfx('wrong')
    onWrong()
    
    showFeedbackMessage('拼写错误，看看正确答案', 'wrong')
  }
}

// 检查完全拼写
const checkSpelling = async () => {
  if (!spellingInput.value.trim()) return
  
  showAnswer.value = true
  const userAnswer = spellingInput.value.trim().toLowerCase()
  const correctAnswer = currentQuestion.value.word.toLowerCase()
  
  if (userAnswer === correctAnswer) {
    isCorrect.value = true
    streak.value++
    correctCount.value++
    
    // 播放正确音效和特效
    playSfx('correct')
    onCorrect()
    
    // 拼写题答对：3分 + 连击奖励
    const basePoints = 3
    const streakBonus = streak.value > 1 ? 1 : 0
    const points = basePoints + streakBonus
    if (!hasEarnedPoints.value) {
      totalEarnedPoints.value += points
      await pointsApi.addPoints('测试答对', points, currentQuestion.value.word)
    }
    
    showFeedbackMessage('拼写正确！', 'correct')
  } else {
    isCorrect.value = false
    streak.value = 0
    totalMistakes.value++
    
    // 加入错题队列
    wrongQueue.value.push({ ...currentQuestion.value })
    
    // 记录错题到薄弱单词统计
    statsApi.recordWordError(currentQuestion.value.word).catch(() => {})
    
    // 记录错题
    currentRoundWrongs.value.push({ word: currentQuestion.value.word, type: 'spelling', correctAnswer: currentQuestion.value.word })
    
    // 播放错误音效和特效
    playSfx('wrong')
    onWrong()
    
    showFeedbackMessage('拼写错误，看看正确答案', 'wrong')
  }
}

// 显示反馈
const showFeedbackMessage = (text, type) => {
  feedbackText.value = text
  feedbackType.value = type
  showFeedback.value = true
  setTimeout(() => {
    showFeedback.value = false
  }, 1500)
}

// 下一题
const nextQuestion = async () => {
  // 重置状态
  selectedOption.value = null
  spellingInput.value = ''
  fillBlankInputs.value = {}
  blankInputRefs.value = {}
  showAnswer.value = false
  isCorrect.value = false
  
  if (currentIndex.value < questions.value.length - 1) {
    // 还有题目
    currentIndex.value++
  } else if (wrongQueue.value.length > 0) {
    // 错题重做模式：下一轮只做上一轮错的题
    
    // 保存当前轮数据
    quizRounds.value.push({
      roundNumber: quizRounds.value.length + 1,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      totalQuestions: questions.value.length,
      correctCount: questions.value.length - wrongQueue.value.length,
      wrongCount: wrongQueue.value.length,
      wrongWords: [...currentRoundWrongs.value],
      passed: false
    })
    
    // 用错题生成下一轮
    questions.value = [...wrongQueue.value]
    totalQuestions.value = questions.value.length
    wrongQueue.value = []
    currentRoundWrongs.value = []
    correctCount.value = 0
    currentIndex.value = 0
  } else {
    // 全部答对，测试通过
    quizCompleted.value = true
    quizPassed.value = true
    
    // 保存当前轮数据
    quizRounds.value.push({
      roundNumber: quizRounds.value.length + 1,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      totalQuestions: questions.value.length,
      correctCount: questions.value.length,
      wrongCount: 0,
      wrongWords: [],
      passed: true
    })
    
    // 播放音效
    playSfx(quizPassed.value ? 'complete' : 'wrong')
    
    if (quizPassed.value) {
      // 通过测试
      
      // ✅ 推进艾宾浩斯进度（测试通过后才推进，而不是翻卡时）
      for (const word of props.words) {
        try {
          await recordReview(word.word, true)
        } catch (e) {
          console.error('推进复习进度失败:', e)
        }
      }
      
      // 全对额外奖励10分
      if (totalMistakes.value === 0 && !hasEarnedPoints.value) {
        totalEarnedPoints.value += 10
        await pointsApi.addPoints('测试全对', 10, '额外奖励')
      }
      
      // Day 3 自动移动到已记住并奖励积分（只移动 stage 2 的单词）
      if (props.reviewStage === 2) {
        if (!hasEarnedPoints.value) {
          for (const word of props.words) {
            totalEarnedPoints.value += 5
            await pointsApi.addPoints('掌握单词', 5, word.word)
          }
        }
        moveWordsToLearned()
      }
      
      // 每日任务完成奖励20分
      if (!hasEarnedPoints.value) {
        totalEarnedPoints.value += 20
        await pointsApi.addPoints('每日任务', 20, '完成探险')
      }
      
      // 标记今日测试完成
      await completeQuiz(totalEarnedPoints.value, quizRounds.value, props.reviewStage)
      hasEarnedPoints.value = true
      
      // 花园资源奖励
      try {
        await addResources('water', 5)  // 基础奖励：5💧
        if (totalMistakes.value === 0) {
          await addResources('water', 5)  // 全对额外：5💧
        }
        if (props.reviewStage === 2) {
          await addResources('fertilizer', 1)  // 毕业考：1🧪
        }
      } catch (e) {
        console.warn('花园资源添加失败（不影响学习）', e)
      }

      // 检查成就
      const newAchievements = await checkAndUnlockAchievements({
        isPerfectQuiz: totalMistakes.value === 0
      })
      if (newAchievements.length > 0) {
        console.log('解锁新成就:', newAchievements)
      }
    }
  }
}

// 重新测试（从头开始）
const retryQuiz = () => {
  quizCompleted.value = false
  quizPassed.value = false
  correctCount.value = 0
  totalMistakes.value = 0
  currentIndex.value = 0
  streak.value = 0
  wrongQueue.value = []
  currentRoundWrongs.value = []
  fillBlankInputs.value = {}
  blankInputRefs.value = {}
  generateQuestions()
}

// 重做错题（只做上一轮错的）
const retryWrong = () => {
  if (wrongQueue.value.length === 0) return
  
  quizCompleted.value = false
  quizPassed.value = false
  questions.value = [...wrongQueue.value]
  totalQuestions.value = questions.value.length
  wrongQueue.value = []
  currentRoundWrongs.value = []
  fillBlankInputs.value = {}
  blankInputRefs.value = {}
  correctCount.value = 0
  currentIndex.value = 0
  streak.value = 0
}

// 将单词移动到已记住
const moveWordsToLearned = async () => {
  try {
    // 只移动毕业考的单词（reviewCount >= 2）
    const wordList = props.words.map(w => w.word)
    if (wordList.length === 0) return
    const res = await wordsApi.moveToLearned(wordList)
    if (res.data.success) {
      console.log(`已将 ${res.data.count} 个单词移到已记住`)
      
      // 检查掌握单词相关成就
      const masteredCount = res.data.count || wordList.length
      const masteryAchievements = await checkAndUnlockAchievements({
        masteredWords: masteredCount
      })
      if (masteryAchievements.length > 0) {
        console.log('解锁掌握成就:', masteryAchievements)
      }
      
      emit('mastered', wordList)
    }
  } catch (e) {
    console.error('移动单词失败:', e)
  }
}

// 初始化
onMounted(() => {
  generateQuestions()
})
</script>

<style scoped>
.quiz-mode {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

/* 完成状态 */
.quiz-complete {
  text-align: center;
  padding: 60px 20px;
}

.complete-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.quiz-complete h2 {
  color: #67c23a;
  font-size: 28px;
  margin-bottom: 10px;
}

.quiz-complete p {
  color: #666;
  font-size: 16px;
  margin-bottom: 20px;
}

.quiz-complete .stats {
  color: #999;
  font-size: 14px;
  margin-bottom: 30px;
}

.quiz-complete .stats span {
  margin: 0 10px;
}

.complete-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

/* 测试区域 */
.quiz-area {
  padding-top: 20px;
}

.back-to-review {
  text-align: center;
  margin-bottom: 20px;
}

.quiz-progress {
  margin-bottom: 30px;
}

.quiz-info {
  margin-top: 10px;
  text-align: center;
}

.pass-rate-hint {
  font-size: 12px;
  color: var(--ocean-pale, #AED6F1);
  opacity: 0.8;
}

.wrong-hint {
  font-size: 12px;
  color: #FF7F50;
}

/* 反馈 */
.feedback {
  text-align: center;
  padding: 12px 24px;
  border-radius: 20px;
  margin-bottom: 20px;
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

/* 选择题 */
.choice-question {
  text-align: center;
}

.question-word {
  font-size: 36px;
  font-weight: bold;
  color: #4A90D9;
  margin-bottom: 10px;
}

.question-meaning {
  font-size: 28px;
  font-weight: bold;
  color: #FF8C69;
  margin-bottom: 10px;
  line-height: 1.4;
}

.question-hint {
  color: #999;
  font-size: 14px;
  margin-bottom: 30px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.option-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  border-radius: 25px;
  transition: all 0.3s;
}

.option-btn.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.option-btn.correct {
  background: #67c23a !important;
  border-color: #67c23a !important;
  color: white !important;
}

.option-btn.wrong {
  background: #f56c6c !important;
  border-color: #f56c6c !important;
  color: white !important;
}

/* 拼写题 */
.spelling-question {
  text-align: center;
}

.spelling-input {
  margin: 20px 0;
}

.spelling-input :deep(.el-input__inner) {
  text-align: center;
  font-size: 20px;
  height: 50px;
}

.correct-answer {
  color: #67c23a;
  font-size: 18px;
  font-weight: bold;
  margin: 15px 0;
}

/* 拼写补全交互式填空（单词始终一行显示） */
.fill-blank-letters {
  /* 依据字母数量动态调整格子/字体大小，保证不换行 */
  --letter-count: 8;
  --gap: clamp(2px, 0.6vw, 4px);
  --tile-size: clamp(18px, calc((100vw - 80px) / (var(--letter-count) + 1)), 36px);
  --tile-h: calc(var(--tile-size) * 1.22);
  --tile-font: calc(var(--tile-size) * 0.78);

  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--gap);
  margin: 25px 0;
  flex-wrap: nowrap;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.letter-fixed {
  flex: 0 0 auto;
  width: var(--tile-size);
  height: var(--tile-h);
  line-height: var(--tile-h);
  text-align: center;
  font-size: var(--tile-font);
  font-weight: bold;
  color: var(--ocean-light, #5DADE2);
  font-family: 'Courier New', monospace;
}

.letter-input {
  flex: 0 0 auto;
  width: var(--tile-size);
  height: var(--tile-h);
  padding: 0;
  text-align: center;
  font-size: var(--tile-font);
  font-weight: bold;
  border: 2px solid var(--ocean-medium, #2E6B8A);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--ocean-deep, #1E3A5F);
  font-family: 'Courier New', monospace;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.letter-input:focus {
  border-color: var(--coral, #FF7F50);
  box-shadow: 0 0 8px rgba(255, 127, 80, 0.4);
}

.letter-input.correct {
  background: #d4edda;
  border-color: #28a745;
  color: #28a745;
}

.letter-input.wrong {
  background: #f8d7da;
  border-color: #dc3545;
  color: #dc3545;
}

/* 下一题按钮 */
.next-btn {
  width: 100%;
  margin-top: 30px;
  height: 50px;
  font-size: 18px;
  border-radius: 25px;
}
</style>
