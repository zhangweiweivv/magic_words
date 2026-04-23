<template>
  <div class="word-card" :class="[{ flipped: isFlipped, 'animate-success': showSuccess, 'animate-error': showError }, cardSkinClass]" @click="flip">
    <div class="card-inner">
      <div class="card-front">
        <div class="card-decoration top-left">🐚</div>
        <div class="card-decoration top-right">🌟</div>
        <div class="emoji">{{ word.emoji || '📝' }}</div>
        <div class="word">{{ word.word }}</div>
        <div class="phonics-row front-phonics" v-if="wordDetail && wordDetail.phonics && wordDetail.phonics.length > 1">
          <div class="syllables">
            <template v-for="(s, idx) in wordDetail.phonics" :key="idx">
              <span class="syllable-tag" :class="'color-' + (idx % 4)">
                <span class="syllable-text">{{ s.syllable }}</span>
                <span class="syllable-ipa" v-if="s.ipa">{{ s.ipa }}</span>
              </span>
              <span v-if="idx < wordDetail.phonics.length - 1" class="syllable-dot">/</span>
            </template>
          </div>
        </div>
        <div class="card-decoration bottom-left">🐠</div>
        <div class="front-example" v-if="frontExample">
          <span class="front-example-icon">💬</span>
          <span class="front-example-text"><HoverableText :text="frontExample" :highlightWord="word.word" /></span>
        </div>
        <div class="hint"><span class="hint-icon">👆</span><span>点击翻转</span></div>
        <div class="bubbles"><span class="bubble" v-for="i in 3" :key="i" :style="{ animationDelay: `${i * 0.5}s` }"></span></div>
      </div>
      
      <div class="card-back">
        <div class="scroll-decoration">📜</div>
        <div class="meaning">{{ word.meaning }}</div>
        
        <!-- 单词详情扩展区块 -->
        <div class="word-detail-box" v-if="wordDetail">
          <div class="detail-row pos-phonetic">
            <span class="pos-badge" v-if="wordDetail.pos">🔤 {{ wordDetail.pos }}</span>
            <span class="phonetic" v-if="wordDetail.phonetic">🔊 {{ wordDetail.phonetic }}</span>
          </div>
          <div class="detail-row" v-if="wordDetail.forms && Object.keys(wordDetail.forms).length > 0">
            <span class="detail-label">📝 词形:</span>
            <span class="detail-value">{{ formatForms(wordDetail.forms) }}</span>
          </div>
        </div>
        
        <div class="examples-container" v-if="examples.length > 0">
          <div class="examples-title">📖 例句</div>
          <div class="example-box" v-for="(ex, idx) in examples" :key="idx">
            <span class="example-icon">{{ idx === 0 ? '💬' : '📝' }}</span>
            <span class="example-text"><HoverableText :text="ex" :highlightWord="word.word" /></span>
          </div>
        </div>
        <div class="topic" v-if="word.topic"><span class="topic-tag">{{ word.topic }}</span></div>

      </div>
    </div>
    <div v-if="showSuccess" class="success-stars"><span v-for="i in 8" :key="i" class="star" :style="getStarStyle(i)">✨</span></div>
  </div>
</template>

<script setup>
import { ref, computed, defineExpose, watch, onMounted } from 'vue'
import HoverableText from './HoverableText.vue'
import { getWordDetail } from '../api/translate'

const props = defineProps({
  word: { type: Object, required: true, default: () => ({ word: '', meaning: '', example: '', emoji: '📝', topic: '' }) },
  showReviewButtons: { type: Boolean, default: false },
  cardSkin: { type: String, default: 'default' }
})

const cardSkinClass = computed(() => {
  if (!props.cardSkin || props.cardSkin === 'default') return ''
  return `skin-${props.cardSkin}`
})

const emit = defineEmits(['remembered', 'forgot'])
const isFlipped = ref(false)
const showSuccess = ref(false)
const showError = ref(false)
const wordDetail = ref(null)

// 加载单词详情
const loadWordDetail = async () => {
  if (!props.word.word) return
  try {
    wordDetail.value = await getWordDetail(props.word.word)
  } catch (e) {
    console.error('加载单词详情失败:', e)
  }
}

// 格式化词形变化
const formatForms = (forms) => {
  const labels = {
    plural: '复数',
    past: '过去式',
    pastParticiple: '过去分词',
    presentParticiple: '现在分词',
    thirdPerson: '三单'
  }
  return Object.entries(forms)
    .map(([key, value]) => value)
    .filter(v => v)
    .join(', ')
}

// 监听 word 变化
watch(() => props.word.word, () => {
  wordDetail.value = null
  loadWordDetail()
}, { immediate: true })

onMounted(() => {
  loadWordDetail()
})

// 解析例句，支持 "1. xxx 2. xxx" 格式
const examples = computed(() => {
  if (!props.word.example) return []
  const text = props.word.example
  // 尝试按 "1. " 和 "2. " 分割
  const parts = text.split(/\s*[12]\.\s*/).filter(s => s.trim())
  if (parts.length >= 2) return parts.slice(0, 2)
  // 如果没有数字标记，尝试按句号分割
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim())
  if (sentences.length >= 2) return sentences.slice(0, 2)
  // 否则返回整个文本作为一个例句
  return [text]
})

// 卡片正面只展示第一句例句（保持简洁）
const frontExample = computed(() => examples.value[0] || '')

const flip = () => { isFlipped.value = !isFlipped.value }
const reset = () => { isFlipped.value = false; showSuccess.value = false; showError.value = false }

const handleRemembered = () => { showSuccess.value = true; setTimeout(() => { emit('remembered') }, 400) }
const handleForgot = () => { showError.value = true; setTimeout(() => { showError.value = false; emit('forgot') }, 500) }

const getStarStyle = (index) => {
  const angle = (index / 8) * 360
  const distance = 80 + Math.random() * 40
  const x = Math.cos(angle * Math.PI / 180) * distance
  const y = Math.sin(angle * Math.PI / 180) * distance
  return { '--x': `${x}px`, '--y': `${y}px`, animationDelay: `${index * 0.05}s` }
}

defineExpose({ reset, flip })
</script>

<style scoped>
.word-card { width: 380px; height: 460px; perspective: 1000px; cursor: pointer; margin: 0 auto; position: relative; }
.card-inner { position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; -webkit-transform-style: preserve-3d; }
.word-card.flipped .card-inner { transform: rotateY(180deg); -webkit-transform: rotateY(180deg); }

.card-front, .card-back { position: absolute; top: 0; left: 0; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; border-radius: var(--duo-radius-lg, 16px); display: flex; flex-direction: column; align-items: center; padding: 28px; box-sizing: border-box; box-shadow: 0 4px 0 var(--duo-border, #E5E5E5); border: 2px solid var(--duo-border, #E5E5E5); }
.card-front { justify-content: center; overflow: hidden; }
.card-back { justify-content: flex-start; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-top: 24px; }

.card-front { background: var(--duo-bg, #fff); color: var(--duo-text, #4B4B4B); z-index: 2; transform: rotateY(0deg); -webkit-transform: rotateY(0deg); justify-content: center; }
.card-front::before { content: ''; }

.card-decoration { display: none; }
@keyframes float-slow { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(5deg); } }

.card-front .emoji { font-size: 72px; margin-bottom: 16px; filter: none; animation: pulse 2s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
.card-front .word { font-size: 40px; font-weight: 900; font-family: var(--duo-font-display, 'Nunito'); margin-bottom: 20px; color: var(--duo-text, #4B4B4B); text-shadow: none; letter-spacing: 0.5px; }
.hint { position: absolute; bottom: 22px; display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--duo-text-muted, #9CA3AF); font-weight: 700; }
.front-example { margin: 12px 16px 0; padding: 10px 14px; background: var(--duo-bg-soft, #F7F9FA); border: 1px solid var(--duo-border, #E5E5E5); border-radius: var(--duo-radius-md, 12px); display: flex; align-items: flex-start; gap: 8px; max-width: 320px; }
.front-example-icon { font-size: 18px; flex-shrink: 0; }
.front-example-text { font-size: 16px; line-height: 1.45; text-align: left; color: var(--duo-text, #4B4B4B); }
.hint-icon { animation: bounce 1s ease-in-out infinite; }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

.bubbles, .bubble { display: none; }
@keyframes bubble-up { 0% { opacity: 0; } 100% { opacity: 0; } }

.card-back { background: var(--duo-bg, #fff); color: var(--duo-text, #4B4B4B); transform: rotateY(180deg); -webkit-transform: rotateY(180deg); z-index: 1; }
.card-back::before { content: ''; }
.scroll-decoration { position: absolute; top: 18px; right: 22px; font-size: 22px; opacity: 0.6; }
.card-back .meaning { font-size: 24px; font-weight: 900; margin-bottom: 12px; line-height: 1.4; color: var(--duo-text, #4B4B4B); text-shadow: none; }
.examples-container { display: flex; flex-direction: column; gap: 8px; width: 100%; margin-bottom: 12px; }
.examples-title { font-size: 13px; font-weight: 800; color: var(--duo-text-muted, #9CA3AF); margin-bottom: 2px; text-align: left; }
.example-box { background: var(--duo-bg-soft, #F7F9FA); border: 1px solid var(--duo-border, #E5E5E5); border-radius: var(--duo-radius-md, 12px); padding: 10px 14px; display: flex; align-items: flex-start; gap: 8px; }
.example-icon { font-size: 20px; flex-shrink: 0; }
.example-text { font-size: 17px; line-height: 1.5; text-align: left; color: var(--duo-text, #4B4B4B); }
.topic-tag { background: var(--duo-green-pale, #E8F8DC); color: var(--duo-green-dark, #46A302); padding: 4px 12px; border-radius: var(--duo-radius-full, 9999px); font-size: 12px; font-weight: 800; }

/* 单词详情扩展区块 */
.word-detail-box {
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md, 16px);
  padding: 8px 12px;
  margin-bottom: 8px;
  width: 100%;
  backdrop-filter: blur(5px);
}
.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.detail-row:last-child {
  margin-bottom: 0;
}
.pos-phonetic {
  justify-content: center;
  gap: 12px;
}
.pos-badge {
  background: rgba(59, 130, 246, 0.8);
  color: white;
  padding: 2px 10px;
  border-radius: var(--radius-full, 9999px);
  font-size: 13px;
  font-weight: 500;
}
.phonetic {
  font-style: italic;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
}
.detail-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}
.detail-value {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.95);
}
.roots-row {
  flex-wrap: wrap;
}
.root-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 12px;
}
.root-part {
  font-weight: bold;
  color: #FFD700;
}
.root-meaning {
  color: rgba(255, 255, 255, 0.9);
}

/* Phonics 音节拆解样式 */
.phonics-row {
  margin: 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
}
.phonics-label {
  font-size: 18px;
  flex-shrink: 0;
}
.syllables {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.syllable-tag {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: bold;
}
.syllable-tag.color-0 { background: #FF6B6B; color: white; }
.syllable-tag.color-1 { background: #4ECDC4; color: white; }
.syllable-tag.color-2 { background: #45B7D1; color: white; }
.syllable-tag.color-3 { background: #F7DC6F; color: #333; }
.syllable-text { font-size: 20px; }
.syllable-ipa { font-size: 14px; opacity: 0.9; margin-top: 2px; }
.syllable-dot { color: rgba(255, 255, 255, 0.7); font-size: 22px; font-weight: bold; margin: 0 2px; }

.review-buttons { display: flex; justify-content: center; gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.2); width: 100%; }
.remembered-btn, .forgot-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border: none; border-radius: var(--radius-full, 9999px); font-size: 14px; font-weight: 600; cursor: pointer; transition: all var(--transition-normal, 0.3s ease); }
.remembered-btn { background: var(--seaweed, #48C9B0); color: white; box-shadow: var(--shadow-seaweed, 0 4px 16px rgba(72, 201, 176, 0.3)); }
.remembered-btn:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(72, 201, 176, 0.4); }
.forgot-btn { background: rgba(255, 255, 255, 0.3); color: white; backdrop-filter: blur(5px); }
.forgot-btn:hover { background: rgba(255, 255, 255, 0.4); transform: scale(1.02); }
.btn-icon { font-size: 16px; }

.word-card.animate-success .card-inner { animation: card-glow-success 0.5s ease-out; }
@keyframes card-glow-success { 0%, 100% { box-shadow: var(--shadow-xl); } 50% { box-shadow: 0 0 40px rgba(72, 201, 176, 0.6), var(--shadow-xl); } }
.word-card.animate-error .card-inner { animation: card-shake 0.5s ease-out; }
@keyframes card-shake { 0%, 100% { transform: rotateY(180deg) translateX(0); } 20% { transform: rotateY(180deg) translateX(-8px); } 40% { transform: rotateY(180deg) translateX(8px); } 60% { transform: rotateY(180deg) translateX(-5px); } 80% { transform: rotateY(180deg) translateX(5px); } }

.success-stars { position: absolute; top: 50%; left: 50%; pointer-events: none; }
.star { position: absolute; font-size: 24px; animation: star-burst 0.6s ease-out forwards; }
@keyframes star-burst { 0% { transform: translate(0, 0) scale(0); opacity: 1; } 100% { transform: translate(var(--x), var(--y)) scale(1); opacity: 0; } }

/* ========== 卡片皮肤 ========== */

/* 贝壳皮肤 */
.skin-card_shell .card-front,
.skin-card_shell .card-back {
  border: 4px solid #D4A574;
  background: linear-gradient(135deg, #FFF8F0 0%, #F5E6D3 100%);
  color: #5D4037;
}
.skin-card_shell .card-front { box-shadow: 0 8px 32px rgba(212, 165, 116, 0.35), inset 0 0 20px rgba(212, 165, 116, 0.1); }

/* 宝箱皮肤 */
.skin-card_chest .card-front,
.skin-card_chest .card-back {
  border: 4px solid #8B6914;
  background: linear-gradient(135deg, #5D4037 0%, #3E2723 100%);
  box-shadow: 0 8px 32px rgba(139, 105, 20, 0.4), inset 0 0 30px rgba(139, 105, 20, 0.15);
}

/* 星星皮肤 */
.skin-card_star .card-front,
.skin-card_star .card-back {
  border: 3px solid #FFD700;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4), 0 0 30px rgba(255, 215, 0, 0.2);
  animation: star-card-glow 2s ease-in-out infinite;
}
@keyframes star-card-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(255, 215, 0, 0.4), 0 0 30px rgba(255, 215, 0, 0.2); }
  50% { box-shadow: 0 0 25px rgba(255, 215, 0, 0.6), 0 0 50px rgba(255, 215, 0, 0.3); }
}

/* 彩虹皮肤 */
.skin-card_rainbow .card-front,
.skin-card_rainbow .card-back {
  border: 4px solid transparent;
  background-clip: padding-box;
  position: relative;
}
.skin-card_rainbow .card-front::after,
.skin-card_rainbow .card-back::after {
  content: '';
  position: absolute;
  top: -4px; left: -4px; right: -4px; bottom: -4px;
  background: linear-gradient(45deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #8B00FF, #FF0000);
  background-size: 400% 400%;
  border-radius: var(--radius-xl, 40px);
  z-index: -1;
  animation: rainbow-border 3s linear infinite;
}
@keyframes rainbow-border {
  0% { background-position: 0% 50%; }
  100% { background-position: 400% 50%; }
}

/* 水晶皮肤 */
.skin-card_crystal .card-front,
.skin-card_crystal .card-back {
  background: linear-gradient(135deg, rgba(200, 230, 255, 0.6) 0%, rgba(180, 210, 255, 0.4) 50%, rgba(200, 230, 255, 0.6) 100%);
  border: 2px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(100, 150, 255, 0.25), inset 0 0 30px rgba(255, 255, 255, 0.2);
}

/* 火焰皮肤 */
.skin-card_fire .card-front,
.skin-card_fire .card-back {
  border: 3px solid #FF4500;
  box-shadow: 0 0 15px rgba(255, 69, 0, 0.5), 0 0 30px rgba(255, 69, 0, 0.2);
  animation: fire-card-glow 1.5s ease-in-out infinite;
}
@keyframes fire-card-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(255, 69, 0, 0.5), 0 0 30px rgba(255, 69, 0, 0.2); }
  50% { box-shadow: 0 0 25px rgba(255, 140, 0, 0.7), 0 0 50px rgba(255, 69, 0, 0.4); }
}
</style>
