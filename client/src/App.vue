<template>
  <div id="app" :data-theme="equipped.theme !== 'default' ? equipped.theme : undefined">
    <!-- 全局音乐播放器 -->
    <MusicPlayer class="global-music-player" />
    <!-- 全局特效容器 -->
    <EffectsContainer />
    
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <router-link to="/" class="navbar-brand">
        <span class="brand-icon">🐬</span>
        <span class="brand-text">可可的单词魔法屋</span>
      </router-link>
      <div class="navbar-nav">
        <router-link to="/" class="nav-link" exact-active-class="nav-active">
          <span class="nav-icon">🏠</span>
          <span class="nav-text">首页</span>
        </router-link>
        <router-link to="/cards" class="nav-link" active-class="nav-active">
          <span class="nav-icon">📖</span>
          <span class="nav-text">复习</span>
        </router-link>
        <router-link to="/words" class="nav-link" active-class="nav-active">
          <span class="nav-icon">📚</span>
          <span class="nav-text">单词表</span>
        </router-link>
      </div>
    </nav>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- 底部导航栏（复习页面隐藏） -->
    <BottomNav v-if="!isCardsPage" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { createApp } from 'vue'
import BottomNav from './components/BottomNav.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import EffectsContainer from './components/effects/EffectsContainer.vue'
import SwimmingFish from './components/ocean/SwimmingFish.vue'
import { useShopConfig } from './composables/useShopConfig'

const route = useRoute()
const isCardsPage = computed(() => route.path.startsWith('/cards'))
const { equipped, loadConfig } = useShopConfig()

let fishApp = null
let fishContainer = null

onMounted(() => {
  // 加载商店配置
  loadConfig()

  // 把 SwimmingFish 挂载到 body 上，避免被 #app 的 overflow 裁剪
  fishContainer = document.createElement('div')
  fishContainer.id = 'swimming-fish-root'
  document.body.appendChild(fishContainer)
  fishApp = createApp(SwimmingFish)
  fishApp.mount(fishContainer)
})

onUnmounted(() => {
  if (fishApp) {
    fishApp.unmount()
    fishApp = null
  }
  if (fishContainer && fishContainer.parentNode) {
    fishContainer.parentNode.removeChild(fishContainer)
    fishContainer = null
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #1E3A5F); /* 深海蓝作为底部安全色 */
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

/* 彻底禁止橡皮筋效果 */
html, body {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 导航栏 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(135deg, #4A90D9 0%, #7DD3E1 100%);
  box-shadow: 0 2px 10px rgba(74, 144, 217, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: white;
}

.brand-icon {
  font-size: 32px;
  animation: swim 2s ease-in-out infinite;
}

@keyframes swim {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  50% {
    transform: translateX(5px) rotate(-3deg);
  }
}

.brand-text {
  font-size: 20px;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.navbar-nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  transition: all 0.3s ease;
  font-size: 15px;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.nav-active {
  background: white !important;
  color: #4A90D9 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-weight: 500;
}

/* 主内容 */
.main-content {
  flex: 1;
  background: var(--bg-gradient, linear-gradient(180deg, #4A90D9 0%, #5DADE2 15%, #2E6B8A 85%, #1E3A5F 100%));
  min-height: 100vh;
}

/* 全局音乐播放器 - 使用 !important 覆盖组件内部样式 */
.global-music-player {
  position: fixed !important;
  top: 16px;
  right: 16px;
  z-index: 1000;
}

/* 响应式 - 移动端 */
@media (max-width: 640px) {
  .navbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
  
  .brand-text {
    font-size: 18px;
  }
  
  .navbar-nav {
    width: 100%;
    justify-content: center;
  }
  
  .nav-link {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .nav-text {
    display: none;
  }
  
  .nav-icon {
    font-size: 22px;
  }
}
</style>
