<template>
  <span class="hoverable-text">
    <template v-for="(part, idx) in parts" :key="idx">
      <span 
        v-if="part.isWord" 
        class="hoverable-word"
        :class="{ 'highlight-word': part.isHighlight }"
        @mouseenter="showTooltip($event, part.text)"
        @mouseleave="hideTooltip"
      >{{ part.text }}</span>
      <span v-else>{{ part.text }}</span>
    </template>
    
    <!-- Tooltip -->
    <Teleport to="body">
      <div 
        v-if="tooltip.visible" 
        class="word-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div v-if="tooltip.loading" class="tooltip-loading">
          <span class="loading-dot">●</span>
          <span class="loading-dot">●</span>
          <span class="loading-dot">●</span>
        </div>
        <template v-else-if="tooltip.translation">
          <div class="tooltip-word">{{ tooltip.word }}</div>
          <div v-if="tooltip.phonetic" class="tooltip-phonetic">{{ tooltip.phonetic }}</div>
          <div class="tooltip-translation">{{ tooltip.translation }}</div>
        </template>
        <div v-else class="tooltip-not-found">暂无释义</div>
      </div>
    </Teleport>
  </span>
</template>

<script setup>
import { ref, computed } from 'vue'
import { translate } from '../api/translate'

const props = defineProps({
  text: { type: String, required: true },
  highlightWord: { type: String, default: '' }
})

// 检查单词是否匹配高亮词（忽略大小写，支持词形变化）
const isHighlightMatch = (word) => {
  if (!props.highlightWord) return false
  const w = word.toLowerCase()
  const h = props.highlightWord.toLowerCase()
  // 精确匹配
  if (w === h) return true
  // 简单词形变化：复数(-s/-es)、过去式(-ed)、进行时(-ing)
  if (w === h + 's' || w === h + 'es' || w === h + 'ed' || w === h + 'ing') return true
  if (h === w + 's' || h === w + 'es' || h === w + 'ed' || h === w + 'ing') return true
  // 去掉结尾的 s/es/ed/ing 再比较
  const wBase = w.replace(/(es|ed|ing|s)$/, '')
  const hBase = h.replace(/(es|ed|ing|s)$/, '')
  if (wBase === hBase && wBase.length >= 3) return true
  return false
}

// 把文本拆分成单词和非单词部分
const parts = computed(() => {
  const result = []
  // 匹配英文单词（包括连字符单词如 well-known）
  const regex = /([a-zA-Z]+(?:-[a-zA-Z]+)*)|([^a-zA-Z]+)/g
  let match
  
  while ((match = regex.exec(props.text)) !== null) {
    if (match[1]) {
      // 英文单词，检查是否需要高亮
      result.push({ text: match[1], isWord: true, isHighlight: isHighlightMatch(match[1]) })
    } else if (match[2]) {
      // 非单词（空格、标点等）
      result.push({ text: match[2], isWord: false, isHighlight: false })
    }
  }
  
  return result
})

// Tooltip 状态
const tooltip = ref({
  visible: false,
  loading: false,
  x: 0,
  y: 0,
  word: '',
  translation: '',
  phonetic: ''
})

let hideTimer = null

const showTooltip = async (event, word) => {
  // 清除隐藏定时器
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  
  const rect = event.target.getBoundingClientRect()
  
  tooltip.value = {
    visible: true,
    loading: true,
    x: rect.left + rect.width / 2,
    y: rect.top - 10,
    word: word,
    translation: '',
    phonetic: ''
  }
  
  // 获取翻译
  const result = await translate(word)
  
  if (result) {
    tooltip.value.translation = result.translation
    tooltip.value.phonetic = result.phonetic || ''
  }
  tooltip.value.loading = false
}

const hideTooltip = () => {
  // 延迟隐藏，让用户有时间移到 tooltip 上
  hideTimer = setTimeout(() => {
    tooltip.value.visible = false
  }, 200)
}
</script>

<style scoped>
.hoverable-text {
  display: inline;
}

.hoverable-word {
  cursor: help;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.4);
  transition: all 0.2s ease;
}

.hoverable-word:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 0 2px;
  margin: 0 -2px;
  border-bottom-color: transparent;
}

.highlight-word {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #1E3A5F;
  font-weight: bold;
  padding: 2px 6px;
  margin: 0 2px;
  border-radius: 6px;
  border-bottom: none;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  animation: highlight-pulse 2s ease-in-out infinite;
}

.highlight-word:hover {
  background: linear-gradient(135deg, #FFE44D 0%, #FFB733 100%);
  margin: 0 2px;
  padding: 2px 6px;
}

@keyframes highlight-pulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4); }
  50% { box-shadow: 0 2px 12px rgba(255, 215, 0, 0.6); }
}

.word-tooltip {
  position: fixed;
  transform: translateX(-50%) translateY(-100%);
  background: linear-gradient(135deg, #1E3A5F 0%, #2E6B8A 100%);
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  max-width: 280px;
  font-size: 14px;
  line-height: 1.5;
  pointer-events: none;
  animation: tooltip-fade-in 0.2s ease;
}

.word-tooltip::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: #2E6B8A;
  border-bottom: none;
}

@keyframes tooltip-fade-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-100%) scale(0.9); }
  to { opacity: 1; transform: translateX(-50%) translateY(-100%) scale(1); }
}

.tooltip-word {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4px;
  color: #7DD3E1;
}

.tooltip-phonetic {
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 6px;
}

.tooltip-translation {
  font-size: 14px;
}

.tooltip-not-found {
  opacity: 0.7;
  font-style: italic;
}

.tooltip-loading {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.loading-dot {
  font-size: 10px;
  animation: loading-bounce 1s infinite;
}

.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes loading-bounce {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-4px); }
}
</style>
