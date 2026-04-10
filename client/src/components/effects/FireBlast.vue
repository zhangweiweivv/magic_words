<template>
  <div class="fire-blast">
    <div v-for="i in 20" :key="i" class="flame" :style="{ '--x': (Math.random()*100)+'%', '--delay': (Math.random()*0.3)+'s', '--size': (20+Math.random()*30)+'px' }">🔥</div>
  </div>
</template>
<script setup></script>
<style scoped>
.fire-blast { position: fixed; bottom: 0; left: 0; right: 0; height: 100vh; pointer-events: none; z-index: 9999; overflow: hidden; }
.flame { position: absolute; bottom: -50px; left: var(--x); font-size: var(--size); animation: rise 1s ease-out forwards; animation-delay: var(--delay); }
@keyframes rise { 0% { transform: translateY(0) scale(1); opacity: 1; } 50% { opacity: 1; } 100% { transform: translateY(-300px) scale(0.5); opacity: 0; } }
</style>
