<template>
  <div v-if="active" class="growth-celebration">
    <!-- Flash overlay -->
    <div class="flash-overlay" />

    <!-- Confetti -->
    <div class="confetti-container">
      <div
        v-for="piece in confettiPieces"
        :key="piece.id"
        class="confetti-piece"
        :style="piece.style"
      />
    </div>

    <!-- Stage name -->
    <div class="stage-name-wrapper">
      <div class="stage-name">{{ stageName }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'

const props = defineProps({
  active: Boolean,
  stageName: String,
  onComplete: Function
})

let timer = null

const CONFETTI_COLORS = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
  '#FF6B9D', '#C084FC', '#F97316', '#06B6D4'
]

const confettiPieces = computed(() => {
  if (!props.active) return []
  const pieces = []
  const count = 25
  for (let i = 0; i < count; i++) {
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    const left = Math.random() * 100
    const size = 8 + Math.random() * 8
    const duration = 2 + Math.random() * 2
    const delay = Math.random() * 1
    const rotation = Math.random() * 360
    const swayAmount = -20 + Math.random() * 40
    const isCircle = Math.random() > 0.5

    pieces.push({
      id: i,
      style: {
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: isCircle ? '50%' : '2px',
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        '--sway': `${swayAmount}px`,
        '--rotation': `${rotation}deg`
      }
    })
  }
  return pieces
})

watch(() => props.active, (val) => {
  if (val) {
    timer = setTimeout(() => {
      props.onComplete?.()
    }, 3000)
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.growth-celebration {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
  animation: celebration-fade 3s ease forwards;
}

@keyframes celebration-fade {
  0%, 80% { opacity: 1; }
  100% { opacity: 0; }
}

/* Flash */
.flash-overlay {
  position: absolute;
  inset: 0;
  background: white;
  animation: flash 0.6s ease-out forwards;
}

@keyframes flash {
  0% { opacity: 0; }
  15% { opacity: 0.7; }
  100% { opacity: 0; }
}

/* Confetti */
.confetti-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -20px;
  opacity: 0;
  animation: confetti-fall var(--duration, 3s) ease-in var(--delay, 0s) forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateX(0) rotate(0deg);
    opacity: 1;
  }
  25% {
    transform: translateX(var(--sway, 15px)) rotate(calc(var(--rotation, 90deg) * 0.5));
  }
  50% {
    transform: translateX(calc(var(--sway, 15px) * -0.5)) rotate(var(--rotation, 90deg));
  }
  75% {
    transform: translateX(var(--sway, 15px)) rotate(calc(var(--rotation, 90deg) * 1.5));
  }
  100% {
    transform: translateX(0) rotate(calc(var(--rotation, 90deg) * 2));
    top: 110%;
    opacity: 0.3;
  }
}

/* Stage Name */
.stage-name-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-name {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, #FFD700, #FFA000, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  filter: drop-shadow(0 2px 8px rgba(255, 193, 7, 0.4));
  animation: stage-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both;
}

@keyframes stage-pop {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
