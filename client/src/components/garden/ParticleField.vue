<template>
  <div class="particle-field">
    <!-- Daytime: sunlight sparkles -->
    <template v-if="!isNight">
      <div
        v-for="p in sunParticles"
        :key="'sun-' + p.id"
        class="particle sun-particle"
        :style="{
          left: p.left + '%',
          animationDuration: p.speed + 's',
          animationDelay: p.delay + 's',
          width: p.size + 'px',
          height: p.size + 'px',
          opacity: p.opacity
        }"
      />
    </template>
    <!-- Nighttime: fireflies -->
    <template v-else>
      <div
        v-for="p in fireflyParticles"
        :key="'fly-' + p.id"
        class="particle firefly"
        :style="{
          left: p.left + '%',
          top: p.top + '%',
          animationDuration: p.speed + 's',
          animationDelay: p.delay + 's',
          width: p.size + 'px',
          height: p.size + 'px'
        }"
      />
    </template>
  </div>
</template>

<script setup>
defineProps({
  isNight: {
    type: Boolean,
    default: false
  }
})

function rand(min, max) {
  return Math.random() * (max - min) + min
}

const sunParticles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: rand(2, 98),
  speed: rand(6, 12),
  delay: rand(-10, 0),
  size: rand(3, 6),
  opacity: rand(0.3, 0.7)
}))

const fireflyParticles = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  left: rand(5, 95),
  top: rand(20, 80),
  speed: rand(4, 8),
  delay: rand(-6, 0),
  size: rand(4, 7)
}))
</script>

<style scoped>
.particle-field {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  will-change: transform, opacity;
}

/* Sunlight sparkles - fall from top */
.sun-particle {
  background: radial-gradient(circle, #FFD700 0%, rgba(255, 215, 0, 0) 70%);
  top: -10px;
  animation: fall linear infinite;
}

@keyframes fall {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.4;
  }
  100% {
    transform: translateY(100vh) translateX(20px);
    opacity: 0;
  }
}

/* Fireflies - random float */
.firefly {
  background: radial-gradient(circle, #69F0AE 0%, rgba(105, 240, 174, 0.3) 50%, transparent 70%);
  box-shadow: 0 0 6px 2px rgba(105, 240, 174, 0.5);
  animation: float ease-in-out infinite alternate;
}

@keyframes float {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.3;
  }
  25% {
    transform: translate(15px, -20px) scale(1.2);
    opacity: 0.9;
  }
  50% {
    transform: translate(-10px, -10px) scale(0.8);
    opacity: 0.5;
  }
  75% {
    transform: translate(20px, 10px) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(-15px, -25px) scale(0.9);
    opacity: 0.4;
  }
}
</style>
