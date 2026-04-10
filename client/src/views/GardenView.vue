<template>
  <div class="garden-container">
    <!-- Layer 0: 天空 -->
    <SkyBackground />
    <!-- Layer 1: 远山 -->
    <MountainLayer :isNight="isNight" />
    <!-- Layer 2: 云朵 -->
    <CloudLayer :isNight="isNight" />
    <!-- Layer 3: 粒子 -->
    <ParticleField :isNight="isNight" />
    <!-- Layer 4: 树 (动态组件) -->
    <div class="tree-container">
      <component :is="currentTreeComponent" :animated="true" :class="{ shaking: isShaking }" />
      <FruitDisplay
        v-if="gardenData.treeStage >= 3"
        :fruits="fruits"
        :treeStage="gardenData.treeStage"
      />
    </div>
    <!-- Layer 5: 草地前景 -->
    <GrassLayer />
    <!-- Layer 6: 浇水动画 -->
    <WateringAnimation
      :active="isWatering"
      @complete="onWaterComplete"
      @shake="onShake"
    />
    <!-- Layer 7: 成长庆祝 -->
    <GrowthCelebration
      :active="showCelebration"
      :stageName="newStageName"
      @complete="showCelebration = false"
    />
    <!-- Layer 8: UI -->
    <GardenUI
      :gardenData="gardenData"
      :isWatering="isWatering"
      @water="doWater"
      @use-sunshine="doUseSunshine"
      @use-fertilizer="doUseFertilizer"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getStatus, water, useSunshine, useFertilizer, getFruits } from '@/api/garden'

import SkyBackground from '@/components/garden/SkyBackground.vue'
import MountainLayer from '@/components/garden/MountainLayer.vue'
import CloudLayer from '@/components/garden/CloudLayer.vue'
import ParticleField from '@/components/garden/ParticleField.vue'
import GrassLayer from '@/components/garden/GrassLayer.vue'
import WateringAnimation from '@/components/garden/WateringAnimation.vue'
import GrowthCelebration from '@/components/garden/GrowthCelebration.vue'
import FruitDisplay from '@/components/garden/FruitDisplay.vue'
import GardenUI from '@/components/garden/GardenUI.vue'

import TreeSeed from '@/components/garden/svg/TreeSeed.vue'
import TreeSprout from '@/components/garden/svg/TreeSprout.vue'
import TreeSmall from '@/components/garden/svg/TreeSmall.vue'
import TreeBig from '@/components/garden/svg/TreeBig.vue'
import TreeFlower from '@/components/garden/svg/TreeFlower.vue'
import TreeHouse from '@/components/garden/svg/TreeHouse.vue'
import TreeWorld from '@/components/garden/svg/TreeWorld.vue'

// State
const gardenData = ref({
  treeStage: 0,
  stageProgress: 0,
  stageThreshold: 1,
  masteredCount: 0,
  resources: { water: 0, sunshine: 0, fertilizer: 0 }
})
const fruits = ref([])
const isWatering = ref(false)
const isShaking = ref(false)
const showCelebration = ref(false)
const newStageName = ref('')
const pendingCelebration = ref(false)

// Tree components mapping
const treeComponents = [TreeSeed, TreeSprout, TreeSmall, TreeBig, TreeFlower, TreeHouse, TreeWorld]
const currentTreeComponent = computed(() => treeComponents[gardenData.value.treeStage] || TreeSeed)

// Night detection
const isNight = computed(() => {
  const h = new Date().getHours()
  return h >= 19 || h < 6
})

// Load data
async function loadStatus() {
  try {
    const res = await getStatus()
    gardenData.value = res
  } catch (e) {
    console.error('Failed to load garden status:', e)
  }
}

async function loadFruits() {
  try {
    const res = await getFruits()
    fruits.value = res.fruits || []
  } catch (e) {
    console.error('Failed to load fruits:', e)
  }
}

// Watering flow
async function doWater() {
  if (isWatering.value || gardenData.value.resources.water <= 0) return
  isWatering.value = true
  try {
    const res = await water()
    // Update resources from response
    if (res.resources) {
      gardenData.value = { ...gardenData.value, ...res }
    }
    if (res.leveledUp) {
      newStageName.value = res.newStage?.label || res.currentStage?.label || ''
      pendingCelebration.value = true
      // Reload full status after level up
      await loadStatus()
    }
  } catch (e) {
    console.error('Failed to water:', e)
    isWatering.value = false
  }
}

function onWaterComplete() {
  isWatering.value = false
  if (pendingCelebration.value) {
    showCelebration.value = true
    pendingCelebration.value = false
    loadFruits()
  }
}

function onShake() {
  isShaking.value = true
  setTimeout(() => { isShaking.value = false }, 500)
}

// Use resources
async function doUseSunshine() {
  if (gardenData.value.resources.sunshine <= 0) return
  try {
    const res = await useSunshine()
    if (res.resources) {
      gardenData.value = { ...gardenData.value, resources: res.resources, sunshineActive: true }
    }
  } catch (e) {
    console.error('Failed to use sunshine:', e)
  }
}

async function doUseFertilizer() {
  if (gardenData.value.resources.fertilizer <= 0) return
  try {
    const res = await useFertilizer()
    if (res.resources) {
      gardenData.value = { ...gardenData.value, resources: res.resources, fertilizerActive: true }
    }
  } catch (e) {
    console.error('Failed to use fertilizer:', e)
  }
}

onMounted(() => {
  loadStatus()
  loadFruits()
})
</script>

<style scoped>
.garden-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.tree-container {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 400px;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (max-width: 400px) {
  .tree-container {
    width: 240px;
    height: 320px;
  }
}

@media (max-width: 340px) {
  .tree-container {
    width: 200px;
    height: 280px;
  }
}

.shaking {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
</style>
