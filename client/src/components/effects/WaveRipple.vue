<template>
  <div class="wave-ripple" :style="{ left: x + 'px', top: y + 'px' }">
    <div v-for="i in 3" :key="i" class="ripple" :style="{ '--delay': (i * 0.2) + 's' }"></div>
  </div>
</template>
<script setup>
defineProps({ x: { type: Number, default: 0 }, y: { type: Number, default: 0 } })
</script>
<style scoped>
.wave-ripple { position: fixed; pointer-events: none; transform: translate(-50%, -50%); }
.ripple { position: absolute; width: 20px; height: 20px; border: 3px solid #5DADE2; border-radius: 50%; animation: ripple 1s ease-out forwards; animation-delay: var(--delay); transform: translate(-50%, -50%); }
@keyframes ripple { 0% { width: 20px; height: 20px; opacity: 1; } 100% { width: 200px; height: 200px; opacity: 0; } }
</style>
