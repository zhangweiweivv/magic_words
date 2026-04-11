<template>
  <div class="poetry-app">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap');
@import './fonts/lxgwwenkailite-regular.css';
@import './fonts/lxgwwenkailite-bold.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --ink-black: #2c2c2c;
  --ink-dark: #4a4a4a;
  --ink-light: #8b8b8b;
  --paper-cream: #f5f0e8;
  --paper-light: #faf7f0;
  --paper-white: #fffcf5;
  --accent-red: #c0392b;
  --accent-red-light: #e74c3c;
  --accent-gold: #d4a843;
  --success-green: #27ae60;
  --border-subtle: #e0d8cc;

  --font-body: 'Noto Serif SC', 'PingFang SC', 'SimSun', serif;
  --font-title: 'LXGW WenKai Lite', 'Noto Serif SC', 'PingFang SC', 'SimSun', serif;
}

body {
  font-family: var(--font-body);
  color: var(--ink-black);
  min-height: 100vh;

  /* 宣纸感：极淡纹理（不使用图片，避免加载与版权问题） */
  background-color: var(--paper-cream);
  background-image:
    radial-gradient(rgba(0, 0, 0, 0.03) 0.5px, transparent 0.5px),
    radial-gradient(rgba(0, 0, 0, 0.02) 0.5px, transparent 0.5px),
    repeating-linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0 1px, transparent 1px 8px);
  background-size: 22px 22px, 31px 31px, 100% 100%;
  background-position: 0 0, 11px 7px, 0 0;
}

/* 标题体系：楷体/文楷风格（仅用于标题/小标题，不影响正文可读性） */
.article-title,
.section-title,
.content-heading {
  font-family: var(--font-title);
}

.poetry-app {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
}
</style>
