<!-- client/src/components/effects/Confetti.vue -->
<template>
  <div class="confetti-burst" :style="{ left: x + 'px', top: y + 'px' }">
    <span
      v-for="(p, i) in pieces"
      :key="i"
      class="piece"
      :style="{
        '--tx': p.tx + 'px',
        '--ty': p.ty + 'px',
        '--rot': p.rot + 'deg',
        '--delay': p.delay + 'ms',
        '--bg': p.color,
        '--shape': p.shape,
        width: p.size + 'px',
        height: (p.size * (p.shape === 'rect' ? 0.5 : 1)) + 'px',
        borderRadius: p.shape === 'circle' ? '50%' : (p.shape === 'rect' ? '2px' : '0')
      }"
    ></span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 }
})

const COLORS = ['#58CC02', '#FFC800', '#FF4B4B', '#1CB0F6', '#CE82FF', '#FF9600', '#FF86C8']
const SHAPES = ['rect', 'circle', 'square']

const pieces = computed(() => {
  const arr = []
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = 80 + Math.random() * 220
    arr.push({
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist - 40, // 整体往上飘一点
      rot: Math.random() * 720 - 360,
      delay: Math.random() * 120,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: 6 + Math.random() * 8
    })
  }
  return arr
})
</script>

<style scoped>
.confetti-burst {
  position: absolute;
  pointer-events: none;
  width: 0;
  height: 0;
}
.piece {
  position: absolute;
  left: 0;
  top: 0;
  background: var(--bg);
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: confetti-fly 1500ms cubic-bezier(0.2, 0.7, 0.3, 1) var(--delay) forwards;
}
@keyframes confetti-fly {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.4) rotate(0deg);
  }
  15% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty) + 200px)) scale(0.9) rotate(var(--rot));
    /* 末尾 +200px 模拟向下重力下落 */
  }
}
</style>
