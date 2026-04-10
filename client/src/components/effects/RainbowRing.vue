<template>
  <div class="rainbow-ring" :style="{ left: x + 'px', top: y + 'px' }">
    <div class="ring"></div>
  </div>
</template>
<script setup>
defineProps({ x: { type: Number, default: 0 }, y: { type: Number, default: 0 } })
</script>
<style scoped>
.rainbow-ring { position: fixed; pointer-events: none; transform: translate(-50%, -50%); }
.ring { width: 50px; height: 50px; border-radius: 50%; background: conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #a66cff, #ff6b6b); animation: expand 1s ease-out forwards; mask: radial-gradient(circle, transparent 40%, black 41%); -webkit-mask: radial-gradient(circle, transparent 40%, black 41%); }
@keyframes expand { 0% { width: 50px; height: 50px; opacity: 1; } 100% { width: 300px; height: 300px; opacity: 0; transform: translate(-125px, -125px); } }
</style>
