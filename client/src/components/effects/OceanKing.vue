<template>
  <div class="ocean-king">
    <div class="crown">👑</div>
    <div class="glow"></div>
    <div class="sparkles"><span v-for="i in 20" :key="i" class="sparkle" :style="{ '--angle': (i*18)+'deg', '--delay': (i*0.1)+'s' }">✨</span></div>
    <div class="title">🎉 海洋之王 🎉</div>
  </div>
</template>
<script setup></script>
<style scoped>
.ocean-king { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; animation: fade 3s ease-in-out forwards; }
.crown { font-size: 80px; animation: bounce 0.5s ease-out; filter: drop-shadow(0 0 20px gold); }
.glow { position: absolute; width: 200px; height: 200px; background: radial-gradient(circle, rgba(255,215,0,0.6), transparent); border-radius: 50%; animation: pulse 1s ease-in-out infinite; }
.sparkles { position: absolute; width: 300px; height: 300px; }
.sparkle { position: absolute; top: 50%; left: 50%; font-size: 20px; animation: orbit 2s linear infinite; animation-delay: var(--delay); }
.title { font-size: 32px; font-weight: bold; color: #FFD700; text-shadow: 0 0 10px rgba(255,215,0,0.8); margin-top: 20px; animation: zoom 0.5s ease-out 0.3s both; }
@keyframes bounce { 0% { transform: scale(0) translateY(-50px); } 50% { transform: scale(1.2) translateY(0); } 100% { transform: scale(1) translateY(0); } }
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.2); opacity: 0.8; } }
@keyframes orbit { 0% { transform: rotate(var(--angle)) translateX(100px) scale(1); } 50% { transform: rotate(calc(var(--angle)+180deg)) translateX(100px) scale(1.5); } 100% { transform: rotate(calc(var(--angle)+360deg)) translateX(100px) scale(1); } }
@keyframes zoom { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes fade { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
</style>
