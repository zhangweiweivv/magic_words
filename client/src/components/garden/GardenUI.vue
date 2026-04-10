<template>
  <div class="garden-ui">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="goBack">←</button>
      <div class="stage-name">{{ stageName }}</div>
      <div class="mastered-count">🍎 {{ gardenData.masteredCount || 0 }}</div>
    </div>

    <!-- 成长进度条 -->
    <div class="progress-section">
      <div class="progress-label">浇水进度 {{ gardenData.stageProgress || 0 }}/{{ stageThreshold }}</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="stage-transition">{{ currentStageName }} → {{ nextStageName }}</div>
    </div>

    <!-- 底部资源栏 -->
    <div class="bottom-bar">
      <div class="resources">
        <span class="resource">💧×{{ gardenData.resources?.water || 0 }}</span>
        <span class="resource">☀️×{{ gardenData.resources?.sunshine || 0 }}</span>
        <span class="resource">🧪×{{ gardenData.resources?.fertilizer || 0 }}</span>
      </div>
      <div class="action-buttons">
        <button
          class="action-btn sunshine-btn"
          :disabled="!gardenData.resources?.sunshine || isWatering"
          @click="$emit('use-sunshine')"
        >☀️</button>
        <button
          class="action-btn water-btn"
          :disabled="!gardenData.resources?.water || isWatering"
          :class="{ pressing: isPressing }"
          @click="onWaterClick"
        >💧</button>
        <button
          class="action-btn fertilizer-btn"
          :disabled="!gardenData.resources?.fertilizer || isWatering"
          @click="$emit('use-fertilizer')"
        >🧪</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  gardenData: { type: Object, default: () => ({}) },
  isWatering: { type: Boolean, default: false }
})

const emit = defineEmits(['water', 'use-sunshine', 'use-fertilizer'])
const router = useRouter()
const isPressing = ref(false)

const stageNames = ['🌱 种子', '🌿 嫩芽', '🪴 小树苗', '🌳 大树', '🌸 开花', '🏡 树屋', '🌍 世界树']

const stageName = computed(() => stageNames[props.gardenData.treeStage] || '🌱 种子')
const currentStageName = computed(() => stageNames[props.gardenData.treeStage] || '种子')
const nextStageName = computed(() => {
  const next = (props.gardenData.treeStage || 0) + 1
  return next < stageNames.length ? stageNames[next] : '满级'
})

const stageThreshold = computed(() => {
  const stages = props.gardenData.stages || []
  const idx = props.gardenData.treeStage || 0
  return stages[idx]?.waterNeeded || 20
})

const progressPercent = computed(() => {
  const progress = props.gardenData.stageProgress || 0
  const threshold = stageThreshold.value
  return Math.min((progress / threshold) * 100, 100)
})

function goBack() {
  router.push('/')
}

function onWaterClick() {
  isPressing.value = true
  setTimeout(() => { isPressing.value = false }, 200)
  emit('water')
}
</script>

<style scoped>
.garden-ui {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
}

.garden-ui > * {
  pointer-events: auto;
}

/* 顶部栏 */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(env(safe-area-inset-top, 12px) + 12px);
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent);
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-name {
  font-size: 18px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.mastered-count {
  font-size: 14px;
  color: white;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 4px 10px;
  border-radius: 12px;
}

/* 成长进度条 */
.progress-section {
  position: absolute;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  max-width: 280px;
  text-align: center;
}

.progress-label {
  font-size: 12px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  margin-bottom: 6px;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4fc3f7, #2196f3);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.stage-transition {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
}

/* 底部资源栏 */
.bottom-bar {
  position: absolute;
  bottom: 70px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent);
}

.resources {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.resource {
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 10px;
  border-radius: 12px;
  backdrop-filter: blur(5px);
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, opacity 0.2s;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(1);
}

.action-btn:active:not(:disabled) {
  transform: scale(0.9);
}

.water-btn {
  width: 60px;
  height: 60px;
  font-size: 28px;
  background: linear-gradient(135deg, #4fc3f7, #2196f3);
}

.water-btn.pressing {
  transform: scale(0.85);
}

.sunshine-btn {
  width: 44px;
  height: 44px;
  font-size: 20px;
  background: linear-gradient(135deg, #ffd54f, #ffb300);
}

.fertilizer-btn {
  width: 44px;
  height: 44px;
  font-size: 20px;
  background: linear-gradient(135deg, #81c784, #43a047);
}
</style>
