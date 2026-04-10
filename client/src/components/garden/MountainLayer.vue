<template>
  <div class="mountain-layer" :class="{ night: isNight }">
    <!-- Back mountain layer - lighter, taller, gentler slopes -->
    <svg class="mountain back" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path
        d="M0,320 L0,180 C120,160 180,100 280,120 C380,140 420,80 520,90 C620,100 680,60 780,70 C880,80 960,50 1060,65 C1160,80 1240,100 1340,90 C1380,85 1420,110 1440,120 L1440,320 Z"
        fill="#B8D4E3"
        fill-opacity="0.6"
      />
    </svg>
    <!-- Front mountain layer - darker, shorter, more pronounced -->
    <svg class="mountain front" viewBox="0 0 1440 320" preserveAspectRatio="none">
      <path
        d="M0,320 L0,220 C80,200 140,170 220,190 C300,210 360,150 440,160 C520,170 580,130 680,145 C780,160 840,120 920,135 C1000,150 1080,110 1160,130 C1240,150 1320,170 1400,160 L1440,180 L1440,320 Z"
        fill="#7BA7BC"
        fill-opacity="0.8"
      />
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
</script>

<style scoped>
.mountain-layer {
  position: absolute;
  bottom: 40%;
  width: 100%;
  height: 30%;
  pointer-events: none;
  transition: filter 2s ease;
}

.mountain-layer.night {
  filter: brightness(0.4);
}

.mountain {
  position: absolute;
  bottom: 0;
  width: 100%;
}

.mountain.back {
  height: 100%;
}

.mountain.front {
  height: 75%;
}
</style>
