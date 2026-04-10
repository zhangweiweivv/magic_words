<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item" exact-active-class="nav-active">
      <span class="nav-icon">🏠</span>
      <span class="nav-label">首页</span>
    </router-link>
    <router-link to="/garden" class="nav-item" active-class="nav-active">
      <span class="nav-icon">🌳</span>
      <span class="nav-label">花园</span>
    </router-link>
    <router-link to="/shop" class="nav-item" active-class="nav-active">
      <span class="nav-icon">🛒</span>
      <span class="nav-label">商店</span>
    </router-link>
    <router-link to="/achievements" class="nav-item" active-class="nav-active">
      <span class="nav-icon">🏆</span>
      <span class="nav-label">成就</span>
    </router-link>
    <router-link to="/report" class="nav-item" active-class="nav-active">
      <span class="nav-icon">📊</span>
      <span class="nav-label">报告</span>
    </router-link>
  </nav>
</template>

<script setup>
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: linear-gradient(180deg, rgba(30, 58, 95, 0.95) 0%, rgba(30, 58, 95, 1) 100%);
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 16px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  border-radius: 12px;
}

.nav-item:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.nav-active {
  color: #7DD3E1 !important;
  background: rgba(125, 211, 225, 0.15);
}

.nav-active .nav-icon {
  transform: scale(1.1);
}

.nav-icon {
  font-size: 22px;
  transition: transform 0.3s ease;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
}
</style>
