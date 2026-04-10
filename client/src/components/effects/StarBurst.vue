<!-- client/src/components/effects/StarBurst.vue -->
<template>
  <div class="star-burst" :style="{ left: x + 'px', top: y + 'px' }">
    <div v-for="i in 12" :key="i" class="star" :style="{ '--delay': (i * 0.05) + 's' }">⭐</div>
  </div>
</template>

<script setup>
defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 }
})
</script>

<style scoped>
.star-burst { position: fixed; pointer-events: none; z-index: 9999; }
.star { position: absolute; font-size: 24px; animation: star-fly 0.8s ease-out forwards; animation-delay: var(--delay); opacity: 0; }
.star:nth-child(1) { animation-name: s1; } .star:nth-child(2) { animation-name: s2; } .star:nth-child(3) { animation-name: s3; }
.star:nth-child(4) { animation-name: s4; } .star:nth-child(5) { animation-name: s5; } .star:nth-child(6) { animation-name: s6; }
.star:nth-child(7) { animation-name: s7; } .star:nth-child(8) { animation-name: s8; } .star:nth-child(9) { animation-name: s9; }
.star:nth-child(10) { animation-name: s10; } .star:nth-child(11) { animation-name: s11; } .star:nth-child(12) { animation-name: s12; }
@keyframes s1 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(70px,0) scale(0); opacity:0; } }
@keyframes s2 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(60px,35px) scale(0); opacity:0; } }
@keyframes s3 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(35px,60px) scale(0); opacity:0; } }
@keyframes s4 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(0,70px) scale(0); opacity:0; } }
@keyframes s5 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(-35px,60px) scale(0); opacity:0; } }
@keyframes s6 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(-60px,35px) scale(0); opacity:0; } }
@keyframes s7 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(-70px,0) scale(0); opacity:0; } }
@keyframes s8 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(-60px,-35px) scale(0); opacity:0; } }
@keyframes s9 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(-35px,-60px) scale(0); opacity:0; } }
@keyframes s10 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(0,-70px) scale(0); opacity:0; } }
@keyframes s11 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(35px,-60px) scale(0); opacity:0; } }
@keyframes s12 { 0% { transform: translate(-50%,-50%) scale(0); opacity:1; } 100% { transform: translate(60px,-35px) scale(0); opacity:0; } }
</style>
