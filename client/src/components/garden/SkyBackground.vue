<template>
  <div class="sky-background" :style="{ background: gradient }" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const gradient = ref('')
let timer = null

const gradients = {
  day: 'linear-gradient(180deg, #4A90D9 0%, #87CEEB 40%, #E0F7FA 100%)',
  dusk: 'linear-gradient(180deg, #FF6B35 0%, #FFB088 30%, #F0E68C 60%, #87CEEB 100%)',
  night: 'linear-gradient(180deg, #0C1445 0%, #1A237E 50%, #283593 100%)'
}

function updateSky() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 17) {
    gradient.value = gradients.day
  } else if (hour >= 17 && hour < 19) {
    gradient.value = gradients.dusk
  } else {
    gradient.value = gradients.night
  }
}

onMounted(() => {
  updateSky()
  timer = setInterval(updateSky, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.sky-background {
  position: absolute;
  inset: 0;
  transition: background 2s ease;
}
</style>
