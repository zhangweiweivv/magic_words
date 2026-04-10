<template>
  <div class="cloud-layer" :class="{ night: isNight }">
    <svg
      v-for="cloud in clouds"
      :key="cloud.id"
      class="cloud"
      :style="{
        width: cloud.width + 'px',
        height: cloud.height + 'px',
        top: cloud.top + '%',
        animationDuration: cloud.speed + 's',
        animationDelay: cloud.delay + 's'
      }"
      :viewBox="`0 0 ${cloud.width} ${cloud.height}`"
    >
      <ellipse :cx="cloud.width * 0.5" :cy="cloud.height * 0.6" :rx="cloud.width * 0.35" :ry="cloud.height * 0.3" fill="white" />
      <ellipse :cx="cloud.width * 0.3" :cy="cloud.height * 0.5" :rx="cloud.width * 0.25" :ry="cloud.height * 0.28" fill="white" />
      <ellipse :cx="cloud.width * 0.7" :cy="cloud.height * 0.5" :rx="cloud.width * 0.25" :ry="cloud.height * 0.28" fill="white" />
      <ellipse :cx="cloud.width * 0.4" :cy="cloud.height * 0.35" :rx="cloud.width * 0.2" :ry="cloud.height * 0.25" fill="white" />
      <ellipse :cx="cloud.width * 0.6" :cy="cloud.height * 0.35" :rx="cloud.width * 0.2" :ry="cloud.height * 0.25" fill="white" />
    </svg>
  </div>
</template>

<script setup>
defineProps({
  isNight: {
    type: Boolean,
    default: false
  }
})

const clouds = [
  { id: 1, width: 150, height: 70, top: 5, speed: 45, delay: 0 },
  { id: 2, width: 120, height: 55, top: 12, speed: 60, delay: -15 },
  { id: 3, width: 100, height: 45, top: 8, speed: 75, delay: -30 },
  { id: 4, width: 80, height: 38, top: 20, speed: 55, delay: -40 },
  { id: 5, width: 130, height: 60, top: 15, speed: 80, delay: -10 }
]
</script>

<style scoped>
.cloud-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  transition: opacity 2s ease;
}

.cloud-layer.night {
  opacity: 0.3;
}

.cloud {
  position: absolute;
  animation: drift linear infinite;
  will-change: transform;
}

@keyframes drift {
  from {
    transform: translateX(100vw);
  }
  to {
    transform: translateX(-200px);
  }
}
</style>
