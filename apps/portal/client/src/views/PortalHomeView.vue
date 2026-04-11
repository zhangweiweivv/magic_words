<template>
  <div class="portal">
    <h1 class="title">🏰 可可魔法屋</h1>
    <p class="subtitle">欢迎来到可可的学习城堡！选择一个房间开始探索吧 ✨</p>

    <div class="rooms">
      <a class="room-card vocab" :href="vocabUrl" target="_blank">
        <div class="room-icon">🌊</div>
        <h2>可可的单词魔法屋</h2>
        <p>英语单词冒险之旅</p>
      </a>

      <a class="room-card poetry" :href="poetryUrl" target="_blank">
        <div class="room-icon">📜</div>
        <h2>可可古诗文</h2>
        <p>小红本 · 诗词古文背诵</p>
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * Build service URL using same host as current page (LAN-friendly).
 * Falls back to localhost if window.location is unavailable (SSR/test).
 */
function serviceUrl(port) {
  try {
    const host = window.location.hostname || 'localhost'
    const protocol = window.location.protocol || 'http:'
    return `${protocol}//${host}:${port}`
  } catch {
    return `http://localhost:${port}`
  }
}

// vocab frontend is served by Vite dev server on 5173 (server API on 3001)
const vocabUrl = computed(() => serviceUrl(5173))
const poetryUrl = computed(() => serviceUrl(3002))
</script>

<style scoped>
.portal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  color: #e0e0e0;
}

.title {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  color: #ffd700;
}

.subtitle {
  font-size: 1.2rem;
  margin-bottom: 3rem;
  opacity: 0.8;
}

.rooms {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.room-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 260px;
  padding: 2.5rem 2rem;
  border-radius: 20px;
  text-decoration: none;
  color: #fff;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.room-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.room-card.vocab {
  background: linear-gradient(145deg, #0077b6, #00b4d8);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.room-card.poetry {
  background: linear-gradient(145deg, #8b0000, #c0392b);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.room-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.room-card h2 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.room-card p {
  font-size: 0.9rem;
  opacity: 0.85;
}
</style>
