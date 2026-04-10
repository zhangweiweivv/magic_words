<template>
  <div v-if="treeStage >= 3 && visibleFruits.length" class="fruit-display">
    <div
      v-for="(fruit, idx) in visibleFruits"
      :key="idx"
      class="fruit"
      :style="fruit.posStyle"
      @click.stop="toggleTooltip(idx)"
    >
      <div class="fruit-dot" :style="{ background: fruit.gradient }" />
      <Transition name="tooltip-fade">
        <div v-if="activeFruit === idx" class="fruit-tooltip">
          <div class="tooltip-word">{{ fruit.word }}</div>
          <div class="tooltip-meaning">{{ fruit.meaning }}</div>
          <div class="tooltip-arrow" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  fruits: {
    type: Array,
    default: () => []
  },
  treeStage: {
    type: Number,
    default: 0
  }
})

const activeFruit = ref(-1)

const FRUIT_COLORS = [
  { color: '#FF6347', gradient: 'radial-gradient(circle at 35% 35%, #FF8A70, #FF6347, #E53935)' },
  { color: '#FFA500', gradient: 'radial-gradient(circle at 35% 35%, #FFCC02, #FFA500, #F57C00)' },
  { color: '#66BB6A', gradient: 'radial-gradient(circle at 35% 35%, #A5D6A7, #66BB6A, #43A047)' }
]

// Generate positions in an elliptical region (simulating tree crown)
function generatePositions(count) {
  const positions = []
  const centerX = 50 // %
  const centerY = 30 // % (crown area, upper part)
  const radiusX = 28 // horizontal spread
  const radiusY = 18 // vertical spread

  for (let i = 0; i < count; i++) {
    // Use polar coordinates for even distribution within ellipse
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8
    const r = 0.3 + Math.random() * 0.7 // avoid center clustering
    const x = centerX + Math.cos(angle) * radiusX * r
    const y = centerY + Math.sin(angle) * radiusY * r
    positions.push({ x, y })
  }
  return positions
}

const visibleFruits = computed(() => {
  const list = props.fruits.slice(0, 30)
  const positions = generatePositions(list.length)

  return list.map((fruit, i) => {
    const colorSet = FRUIT_COLORS[i % FRUIT_COLORS.length]
    const pos = positions[i]
    const bobDelay = (i * 0.3) % 3
    const bobDuration = 2 + (i % 3) * 0.5

    return {
      word: fruit.word,
      meaning: fruit.meaning,
      gradient: fruit.color
        ? `radial-gradient(circle at 35% 35%, ${fruit.color}88, ${fruit.color}, ${fruit.color}dd)`
        : colorSet.gradient,
      posStyle: {
        top: `${pos.y}%`,
        left: `${pos.x}%`,
        animationDelay: `${bobDelay}s`,
        animationDuration: `${bobDuration}s`
      }
    }
  })
})

function toggleTooltip(idx) {
  activeFruit.value = activeFruit.value === idx ? -1 : idx
}

// Close tooltip on outside click
function handleOutsideClick() {
  activeFruit.value = -1
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
.fruit-display {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.fruit {
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
  transform: translate(-50%, -50%);
  animation: fruit-bob ease-in-out infinite;
}

.fruit-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.fruit:hover .fruit-dot {
  transform: scale(1.3);
}

@keyframes fruit-bob {
  0%, 100% { transform: translate(-50%, -50%) translateY(0); }
  50% { transform: translate(-50%, -50%) translateY(-4px); }
}

/* Tooltip */
.fruit-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: #1A237E;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: nowrap;
  font-size: 13px;
  z-index: 30;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-word {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 2px;
}

.tooltip-meaning {
  opacity: 0.85;
  font-size: 12px;
}

.tooltip-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #1A237E;
}

/* Tooltip transition */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
