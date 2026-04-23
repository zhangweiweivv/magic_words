<template>
  <div id="app" :data-theme="equipped.theme !== 'default' ? equipped.theme : undefined">
    <!-- 全局装饰背景（渐变 + 浮动小图标） -->
    <DecorBackground />
    <!-- 全局音乐播放器 -->
    <MusicPlayer class="global-music-player" />
    <!-- 全局特效容器 -->
    <EffectsContainer />
    
    <!-- 顶部导航栏 -->
    <nav class="navbar">
      <router-link to="/" class="navbar-brand">
        <span class="brand-icon">🐱</span>
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import EffectsContainer from './components/effects/EffectsContainer.vue'
import DecorBackground from './components/DecorBackground.vue'
import { useShopConfig } from './composables/useShopConfig'

const route = useRoute()
const isCardsPage = computed(() => route.path.startsWith('/cards'))
const { equipped, loadConfig } = useShopConfig()

loadConfig()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: var(--duo-font-body, 'Nunito', 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--duo-bg, #fff);
  color: var(--duo-text, #4B4B4B);
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
  padding: 10px 20px;
  background: rgba(255, 248, 231, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 2px solid var(--duo-border, #E5E5E5);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--duo-text, #4B4B4B);
}

.brand-icon {
  font-size: 28px;
}

.brand-text {
  font-size: 18px;
  font-weight: 900;
  font-family: var(--duo-font-display);
  color: var(--duo-text, #4B4B4B);
}

.navbar-nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  text-decoration: none;
  color: var(--duo-text-muted, #9CA3AF);
  border-radius: 12px;
  transition: background 120ms ease, color 120ms ease;
  font-size: 14px;
  font-weight: 800;
}

.nav-link:hover {
  background: var(--duo-bg-soft, #F7F9FA);
  color: var(--duo-text, #4B4B4B);
}

.nav-active {
  background: var(--duo-green-pale, #E8F8DC) !important;
  color: var(--duo-green-dark, #46A302) !important;
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-weight: 800;
}

/* 主内容 */
.main-content {
  flex: 1;
  background: transparent;
  min-height: 100vh;
  color: var(--duo-text, #4B4B4B);
  position: relative;
  z-index: 1;
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
