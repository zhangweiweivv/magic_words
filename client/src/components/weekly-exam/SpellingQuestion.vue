<template>
  <div class="spelling-question">
    <div class="question-meaning">{{ question.meaning }}</div>
    <div class="question-hint">请拼写英文单词</div>

    <el-input
      v-model="input"
      class="spelling-input"
      size="large"
      :disabled="showAnswer"
      @keyup.enter="checkAnswer"
      placeholder="输入英文单词..."
    />

    <div v-if="showAnswer && !isCorrect" class="correct-answer">正确答案: {{ question.word }}</div>

    <el-button
      v-if="!showAnswer"
      type="primary"
      size="large"
      @click="checkAnswer"
      :disabled="!input.trim()"
    >
      确认
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  question: { type: Object, required: true },
  showAnswer: { type: Boolean, default: false },
  isCorrect: { type: Boolean, default: false },
})

const emit = defineEmits(['answer'])
const input = ref('')

function checkAnswer() {
  if (props.showAnswer || !input.value.trim()) return
  const userAnswer = input.value.trim().toLowerCase()
  const correctAnswer = (props.question.word || '').toLowerCase()
  emit('answer', { correct: userAnswer === correctAnswer })
}

defineExpose({
  reset() {
    input.value = ''
  }
})
</script>

<style scoped>
.spelling-question {
  text-align: center;
  margin-top: 10px;
}

.question-meaning {
  font-size: 28px;
  font-weight: bold;
  color: #FF8C69;
  margin-bottom: 10px;
  line-height: 1.4;
}

.question-hint {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-bottom: 20px;
  text-shadow: 1px 1px 2px rgba(30, 58, 95, 0.25);
}

.spelling-input {
  margin: 18px 0;
}

.spelling-input :deep(.el-input__inner) {
  text-align: center;
  font-size: 20px;
  height: 50px;
}

.correct-answer {
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  margin: 12px 0;
  text-shadow: 2px 2px 4px rgba(30, 58, 95, 0.35);
}
</style>
