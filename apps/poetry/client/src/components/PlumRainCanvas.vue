<template>
  <canvas class="plum-rain-canvas" data-test="plum-rain-canvas" aria-hidden="true"></canvas>
</template>

<script setup>
// Minimal skeleton. Animation + settings will be added via TDD in follow-up commits.
</script>

<style scoped>
.plum-rain-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 999;
}
</style>
