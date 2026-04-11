<template>
  <div class="choice-question">
    <div class="question-meaning">{{ question.meaning }}</div>
    <div class="question-hint">选择正确的英文单词</div>

    <div class="options">
      <el-button
        v-for="(option, idx) in question.options || []"
        :key="idx"
        class="option-btn"
        :class="{
          selected: selectedOption === idx,
          correct: showAnswer && option === question.word,
          wrong: showAnswer && selectedOption === idx && option !== question.word
        }"
        :disabled="showAnswer"
        @click="selectOption(idx)"
      >
        {{ option }}
      </el-button>
    </div>

    <div v-if="showAnswer && !isCorrect" class="correct-answer">正确答案: {{ question.word }}</div>
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
const selectedOption = ref(null)

function selectOption(idx) {
  if (props.showAnswer) return
  selectedOption.value = idx
  const options = props.question.options || []
  const chosen = options[idx]
  const correct = (chosen || '').toLowerCase() === (props.question.word || '').toLowerCase()
  emit('answer', { correct, selectedOption: idx })
}

// Reset when question changes
defineExpose({
  reset() {
    selectedOption.value = null
  }
})
</script>

<style scoped>
.choice-question {
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

.options {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.correct-answer {
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  margin: 12px 0;
  text-shadow: 2px 2px 4px rgba(30, 58, 95, 0.35);
}
</style>
