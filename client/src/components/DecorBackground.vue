<!-- client/src/components/DecorBackground.vue -->
<template>
  <div class="decor-bg" aria-hidden="true">
    <!-- 渐变层 -->
    <div class="decor-gradient"></div>
    <!-- 浮动图标层 -->
    <div class="decor-icons">
      <span
        v-for="(icon, i) in icons"
        :key="i"
        class="decor-icon"
        :style="{
          left: icon.left + '%',
          top: icon.top + '%',
          fontSize: icon.size + 'px',
          opacity: icon.opacity,
          animationDuration: icon.dur + 's',
          animationDelay: icon.delay + 's',
          transform: `rotate(${icon.rot}deg)`
        }"
      >{{ icon.emoji }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 装饰图标池：学习/童趣
const POOL = ['⭐', '🌟', '✨', '📚', '✏️', '🎈', '🌈', '☁️', '🍀', '🎨', '🐱', '🐶', '🦋', '🌸', '💡']

// 固定 seed 让每次刷新位置一致（不抖）
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const icons = computed(() => {
  const rand = seededRandom(42)
  const arr = []
  // 24 个均匀分布在整页（top 0-100% + 越下越多）
  for (let i = 0; i < 24; i++) {
    arr.push({
      emoji: POOL[Math.floor(rand() * POOL.length)],
      left: rand() * 95 + 2.5,           // 2.5%-97.5%
      top: rand() * 100,                  // 0-100%
      size: 22 + Math.floor(rand() * 24), // 22-46px
      opacity: 0.08 + rand() * 0.12,      // 0.08-0.20，淡到不抢戏
      dur: 8 + rand() * 8,                // 8-16s 漂浮
      delay: rand() * -10,                // 错峰
      rot: Math.floor(rand() * 60 - 30)   // -30~30 度
    })
  }
  return arr
})
</script>

<style scoped>
.decor-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

/* 渐变层：米黄 → 淡桃 → 极淡蓝 */
.decor-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 15% 10%, rgba(255, 200, 150, 0.18) 0%, transparent 40%),
    radial-gradient(circle at 85% 30%, rgba(180, 220, 255, 0.18) 0%, transparent 45%),
    radial-gradient(circle at 50% 95%, rgba(200, 255, 180, 0.16) 0%, transparent 45%),
    linear-gradient(180deg, #FFF8E7 0%, #FFF3D6 60%, #FFEEDC 100%);
}

.decor-icons {
  position: absolute;
  inset: 0;
}

.decor-icon {
  position: absolute;
  user-select: none;
  animation-name: float-y;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  will-change: transform, opacity;
  filter: saturate(0.85);
}

@keyframes float-y {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-12px) rotate(8deg);
  }
}
</style>
