<template>
  <nav class="bottom-nav">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :exact-active-class="item.exact ? 'nav-active' : ''"
      :active-class="item.exact ? '' : 'nav-active'"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
const items = [
  { to: '/',             icon: '🏠', label: '首页',  exact: true },
  { to: '/garden',       icon: '🌳', label: '花园' },
  { to: '/shop',         icon: '🛒', label: '商店' },
  { to: '/achievements', icon: '🏆', label: '成就' },
  { to: '/report',       icon: '📊', label: '报告' }
]
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--duo-bg, #fff);
  border-top: 2px solid var(--duo-border, #E5E5E5);
  padding: 8px 4px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0));
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  z-index: 1000;
  font-family: var(--duo-font-body);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px;
  text-decoration: none;
  color: var(--duo-text-muted, #9CA3AF);
  border-radius: var(--duo-radius-md, 12px);
  transition: background 120ms ease, color 120ms ease, transform 120ms ease;
  -webkit-tap-highlight-color: transparent;
  position: relative;
}

.nav-item:hover {
  background: var(--duo-bg-soft, #F7F9FA);
}

.nav-active {
  color: var(--duo-green-dark, #46A302) !important;
  background: var(--duo-green-pale, #E8F8DC) !important;
}

/* Duolingo 招牌：active 项顶部一条小色条 */
.nav-active::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 4px;
  background: var(--duo-green, #58CC02);
  border-radius: 0 0 4px 4px;
}

.nav-active .nav-icon {
  transform: scale(1.1);
}

.nav-icon {
  font-size: 22px;
  line-height: 1;
  transition: transform 120ms ease;
}

.nav-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
}
</style>
