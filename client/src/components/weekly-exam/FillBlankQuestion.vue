<template>
  <div class="fill-blank-question">
    <div class="question-meaning">{{ question.meaning }}</div>
    <div class="question-hint">填写缺失的字母</div>

    <div
      class="fill-blank-letters"
      :style="{ '--letter-count': hintLetters.length }"
    >
      <template v-for="(letter, idx) in hintLetters" :key="idx">
        <span v-if="!letter.isBlank" class="letter-fixed">{{ letter.char }}</span>
        <input
          v-else
          type="text"
          maxlength="1"
          class="letter-input"
          :class="{
            correct: showAnswer && inputs[idx]?.toLowerCase() === letter.char.toLowerCase(),
            wrong: showAnswer && inputs[idx]?.toLowerCase() !== letter.char.toLowerCase()
          }"
          :disabled="showAnswer"
          :ref="(el) => { if (el) inputRefs[idx] = el }"
          v-model="inputs[idx]"
          @input="onBlankInput(idx)"
          @keydown="onBlankKeydown($event, idx)"
        />
      </template>
    </div>

    <div v-if="showAnswer && !isCorrect" class="correct-answer">正确答案: {{ question.word }}</div>

    <el-button
      v-if="!showAnswer"
      type="primary"
      size="large"
      @click="checkAnswer"
      :disabled="!allFilled"
    >
      确认
    </el-button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  question: { type: Object, required: true },
  showAnswer: { type: Boolean, default: false },
  isCorrect: { type: Boolean, default: false },
})

const emit = defineEmits(['answer'])
const inputs = ref({})
const inputRefs = ref({})
const hintLetters = ref([])

function buildHintLetters(word, hint) {
  const w = (word || '').split('')
  const h = (hint || '').split('')
  if (hint && h.length === w.length) {
    return h.map((ch, idx) => {
      if (ch === '_') return { char: w[idx], isBlank: true }
      return { char: ch, isBlank: false }
    })
  }
  return w.map((ch, idx) => {
    const isLetter = /[a-zA-Z]/.test(ch)
    const fixed = idx === 0 || !isLetter
    return { char: ch, isBlank: !fixed }
  })
}

watch(() => props.question, (q) => {
  if (q?.type === 'fillBlank') {
    hintLetters.value = buildHintLetters(q.word, q.hint)
  } else {
    hintLetters.value = []
  }
  inputs.value = {}
  inputRefs.value = {}
}, { immediate: true })

const allFilled = computed(() => {
  if (!hintLetters.value.length) return false
  const blanks = hintLetters.value
    .map((l, idx) => ({ ...l, idx }))
    .filter(l => l.isBlank)
  return blanks.every(l => inputs.value[l.idx]?.trim())
})

function getBlankIndices() {
  return hintLetters.value
    .map((l, i) => ({ l, i }))
    .filter(x => x.l.isBlank)
    .map(x => x.i)
    .sort((a, b) => a - b)
}

function onBlankInput(idx) {
  const val = inputs.value[idx]
  if (val && val.length === 1) {
    const blanks = getBlankIndices()
    const currentPos = blanks.indexOf(idx)
    if (currentPos < blanks.length - 1) {
      inputRefs.value[blanks[currentPos + 1]]?.focus()
    }
  }
}

function onBlankKeydown(e, idx) {
  if (e.key === 'Backspace' && !inputs.value[idx]) {
    const blanks = getBlankIndices()
    const currentPos = blanks.indexOf(idx)
    if (currentPos > 0) {
      inputRefs.value[blanks[currentPos - 1]]?.focus()
    }
  } else if (e.key === 'Enter') {
    if (allFilled.value) checkAnswer()
  }
}

function checkAnswer() {
  if (props.showAnswer || !allFilled.value) return
  const blanks = hintLetters.value
    .map((l, idx) => ({ ...l, idx }))
    .filter(l => l.isBlank)
  const correct = blanks.every(l => {
    const user = (inputs.value[l.idx] || '').toLowerCase()
    return user === (l.char || '').toLowerCase()
  })
  emit('answer', { correct })
}

defineExpose({
  reset() {
    inputs.value = {}
    inputRefs.value = {}
  }
})
</script>

<style scoped>
.fill-blank-question {
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
  margin: 22px 0;
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
  color: var(--ocean-pale);
  font-family: 'Courier New', monospace;
  text-shadow: 2px 2px 4px rgba(30, 58, 95, 0.25);
}

.letter-input {
  flex: 0 0 auto;
  width: var(--tile-size);
  height: var(--tile-h);
  padding: 0;
  text-align: center;
  font-size: var(--tile-font);
  font-weight: bold;
  border: 2px solid var(--ocean-pale);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--ocean-deep);
  font-family: 'Courier New', monospace;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.letter-input:focus {
  border-color: var(--coral);
  box-shadow: 0 0 8px rgba(255, 127, 80, 0.35);
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

.correct-answer {
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  margin: 12px 0;
  text-shadow: 2px 2px 4px rgba(30, 58, 95, 0.35);
}
</style>
