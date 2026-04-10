<template>
  <div v-if="active" class="watering-animation" @animationend.self="handleEnd">
    <!-- Watering Can -->
    <div class="watering-can-wrapper">
      <svg class="watering-can-svg" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="wa-can-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#64B5F6" />
            <stop offset="100%" stop-color="#1976D2" />
          </linearGradient>
          <linearGradient id="wa-water-flow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4FC3F7" />
            <stop offset="100%" stop-color="#29B6F6" />
          </linearGradient>
        </defs>
        <!-- Can body -->
        <rect x="35" y="30" width="50" height="40" rx="6" fill="url(#wa-can-body)" />
        <!-- Spout -->
        <polygon points="35,35 10,20 12,25 35,42" fill="#42A5F5" />
        <!-- Spout head (rose) -->
        <ellipse cx="8" cy="22" rx="6" ry="4" fill="#1E88E5" />
        <circle cx="4" cy="21" r="1" fill="#90CAF9" />
        <circle cx="8" cy="20" r="1" fill="#90CAF9" />
        <circle cx="12" cy="21" r="1" fill="#90CAF9" />
        <circle cx="6" cy="24" r="1" fill="#90CAF9" />
        <circle cx="10" cy="24" r="1" fill="#90CAF9" />
        <!-- Handle -->
        <path d="M70,30 Q95,10 85,30" stroke="#1565C0" stroke-width="5" fill="none" stroke-linecap="round" />
        <!-- Highlight -->
        <rect x="40" y="34" width="20" height="4" rx="2" fill="#BBDEFB" opacity="0.5" />
      </svg>
    </div>

    <!-- Water stream (SVG arc) -->
    <svg class="water-stream" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wa-stream-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4FC3F7" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#29B6F6" stop-opacity="0.6" />
        </linearGradient>
      </defs>
      <path
        class="stream-path"
        d="M30,10 Q20,80 50,150 Q70,200 100,250"
        stroke="url(#wa-stream-grad)"
        stroke-width="4"
        fill="none"
        stroke-linecap="round"
      />
      <path
        class="stream-path stream-path-2"
        d="M34,12 Q24,85 54,155 Q74,205 104,255"
        stroke="url(#wa-stream-grad)"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
        opacity="0.5"
      />
    </svg>

    <!-- Splash droplets -->
    <div class="splash-container">
      <div v-for="n in 7" :key="n" class="splash-drop" :class="'drop-' + n" />
    </div>
  </div>
</template>

<script setup>
import { watch, onUnmounted } from 'vue'

const props = defineProps({
  active: Boolean,
  onComplete: Function
})

const emit = defineEmits(['shake'])

let timer = null

watch(() => props.active, (val) => {
  if (val) {
    // Emit shake at 0.6s (when water starts hitting)
    setTimeout(() => emit('shake'), 600)
    // Complete after 2s
    timer = setTimeout(() => {
      props.onComplete?.()
    }, 2000)
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.watering-animation {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 20;
}

/* === Watering Can === */
.watering-can-wrapper {
  position: absolute;
  top: 5%;
  right: 5%;
  width: 80px;
  height: 70px;
  animation: can-sequence 2s ease-in-out forwards;
  transform-origin: center center;
}

.watering-can-svg {
  width: 100%;
  height: 100%;
}

@keyframes can-sequence {
  /* 0-0.3s: slide in from right */
  0% { transform: translateX(120%) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  15% { transform: translateX(0%) rotate(0deg); }
  /* 0.3-0.5s: tilt 30 degrees */
  25% { transform: translateX(0%) rotate(-30deg); }
  /* 0.5-1.5s: stay tilted */
  75% { transform: translateX(0%) rotate(-30deg); }
  /* 1.5-1.8s: straighten up */
  90% { transform: translateX(0%) rotate(0deg); }
  /* 1.8-2.0s: slide out */
  95% { opacity: 1; }
  100% { transform: translateX(120%) rotate(0deg); opacity: 0; }
}

/* === Water Stream === */
.water-stream {
  position: absolute;
  top: 10%;
  right: 15%;
  width: 100px;
  height: 200px;
  opacity: 0;
  animation: stream-show 2s ease forwards;
}

.stream-path {
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
  animation: stream-flow 1s ease-in forwards;
  animation-delay: 0.5s;
}

.stream-path-2 {
  animation-delay: 0.6s;
}

@keyframes stream-show {
  0%, 24% { opacity: 0; }
  30% { opacity: 1; }
  75% { opacity: 1; }
  85% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes stream-flow {
  0% { stroke-dashoffset: 400; }
  100% { stroke-dashoffset: 0; }
}

/* === Splash Drops === */
.splash-container {
  position: absolute;
  bottom: 30%;
  left: 50%;
  width: 0;
  height: 0;
}

.splash-drop {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4FC3F7;
  opacity: 0;
}

.drop-1 { animation: splash-1 0.5s ease-out 1.0s forwards; }
.drop-2 { animation: splash-2 0.5s ease-out 1.05s forwards; }
.drop-3 { animation: splash-3 0.5s ease-out 1.1s forwards; }
.drop-4 { animation: splash-4 0.4s ease-out 1.15s forwards; }
.drop-5 { animation: splash-5 0.5s ease-out 1.0s forwards; width: 4px; height: 4px; }
.drop-6 { animation: splash-6 0.4s ease-out 1.1s forwards; width: 5px; height: 5px; }
.drop-7 { animation: splash-7 0.5s ease-out 1.05s forwards; width: 3px; height: 3px; }

@keyframes splash-1 {
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(-25px, -35px); opacity: 0; }
}
@keyframes splash-2 {
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(20px, -30px); opacity: 0; }
}
@keyframes splash-3 {
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(-15px, -40px); opacity: 0; }
}
@keyframes splash-4 {
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(30px, -20px); opacity: 0; }
}
@keyframes splash-5 {
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(-35px, -15px); opacity: 0; }
}
@keyframes splash-6 {
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(10px, -45px); opacity: 0; }
}
@keyframes splash-7 {
  0% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(-10px, -25px); opacity: 0; }
}
</style>
