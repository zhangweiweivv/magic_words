<template>
  <div class="grass-layer">
    <svg class="grass-svg" viewBox="0 0 1440 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4CAF50" />
          <stop offset="100%" stop-color="#66BB6A" />
        </linearGradient>
      </defs>
      <!-- Grass surface with gentle undulation -->
      <path
        d="M0,60 C60,45 120,55 200,50 C280,45 360,60 440,55 C520,50 600,40 720,48 C840,56 960,42 1080,50 C1200,58 1320,46 1440,52 L1440,200 L0,200 Z"
        fill="url(#grassGrad)"
      />
    </svg>
    <!-- Flower decorations -->
    <div
      v-for="flower in flowers"
      :key="flower.id"
      class="flower"
      :style="{
        left: flower.left + '%',
        bottom: flower.bottom + 'px',
        animationDuration: flower.swaySpeed + 's',
        animationDelay: flower.delay + 's'
      }"
    >
      <svg width="16" height="24" viewBox="0 0 16 24">
        <!-- Stem -->
        <line x1="8" y1="24" x2="8" y2="10" stroke="#388E3C" stroke-width="1.5" />
        <!-- Petals -->
        <circle cx="8" cy="7" r="3.5" :fill="flower.color" opacity="0.9" />
        <circle cx="5" cy="8.5" r="3" :fill="flower.color" opacity="0.8" />
        <circle cx="11" cy="8.5" r="3" :fill="flower.color" opacity="0.8" />
        <circle cx="6" cy="5.5" r="2.8" :fill="flower.color" opacity="0.8" />
        <circle cx="10" cy="5.5" r="2.8" :fill="flower.color" opacity="0.8" />
        <!-- Center -->
        <circle cx="8" cy="7" r="2" fill="#FFF176" />
      </svg>
    </div>
  </div>
</template>

<script setup>
const flowers = [
  { id: 1, left: 8, bottom: 55, color: '#F48FB1', swaySpeed: 3, delay: 0 },
  { id: 2, left: 22, bottom: 50, color: '#FFD54F', swaySpeed: 3.5, delay: -0.5 },
  { id: 3, left: 35, bottom: 58, color: '#CE93D8', swaySpeed: 2.8, delay: -1 },
  { id: 4, left: 52, bottom: 48, color: '#F48FB1', swaySpeed: 3.2, delay: -1.5 },
  { id: 5, left: 65, bottom: 54, color: '#FFD54F', swaySpeed: 3.6, delay: -0.8 },
  { id: 6, left: 78, bottom: 52, color: '#CE93D8', swaySpeed: 2.9, delay: -2 },
  { id: 7, left: 90, bottom: 56, color: '#F48FB1', swaySpeed: 3.3, delay: -0.3 }
]
</script>

<style scoped>
.grass-layer {
  position: absolute;
  bottom: 60px;
  width: 100%;
  height: 15vh;
  z-index: 4;
  pointer-events: none;
}

.grass-svg {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100%;
}

.flower {
  position: absolute;
  animation: sway ease-in-out infinite alternate;
  transform-origin: bottom center;
  will-change: transform;
}

@keyframes sway {
  from {
    transform: rotate(-5deg);
  }
  to {
    transform: rotate(5deg);
  }
}
</style>
