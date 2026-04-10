<template>
  <div class="bubble-background">
    <div 
      v-for="bubble in bubbles" 
      :key="bubble.id"
      class="bubble"
      :style="bubble.style"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: {
    type: Number,
    default: 8
  }
})

const bubbles = computed(() => {
  return Array.from({ length: props.count }, (_, i) => {
    const size = 10 + Math.random() * 30
    const left = Math.random() * 100
    const delay = Math.random() * 5
    const duration = 6 + Math.random() * 6
    
    return {
      id: i,
      style: {
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }
    }
  })
})
</script>

<style scoped>
.bubble-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.bubble {
  position: absolute;
  bottom: -50px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.8),
    rgba(174, 214, 241, 0.4) 50%,
    rgba(93, 173, 226, 0.2)
  );
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: bubble-rise 8s ease-in-out infinite,
             bubble-wobble 3s ease-in-out infinite;
}

@keyframes bubble-rise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.5;
  }
  100% {
    transform: translateY(-100vh) scale(0.8);
    opacity: 0;
  }
}

@keyframes bubble-wobble {
  0%, 100% { margin-left: 0; }
  25% { margin-left: 15px; }
  75% { margin-left: -15px; }
}
</style>
