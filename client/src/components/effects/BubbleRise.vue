<template>
  <div class="bubble-rise" :style="{ left: x + 'px', top: y + 'px' }">
    <div v-for="i in 10" :key="i" class="bubble" :style="{ '--x': (Math.random()*100-50)+'px', '--delay': (Math.random()*0.5)+'s', '--size': (10+Math.random()*20)+'px' }"></div>
  </div>
</template>
<script setup>
defineProps({ x: { type: Number, default: 0 }, y: { type: Number, default: 0 } })
</script>
<style scoped>
.bubble-rise { position: fixed; pointer-events: none; transform: translate(-50%, -50%); }
.bubble { position: absolute; width: var(--size); height: var(--size); background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(93,173,226,0.4)); border-radius: 50%; animation: float 1.5s ease-out forwards; animation-delay: var(--delay); border: 1px solid rgba(255,255,255,0.5); }
@keyframes float { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(var(--x), -150px) scale(0.5); opacity: 0; } }
</style>
