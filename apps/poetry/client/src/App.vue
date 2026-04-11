<template>
  <div class="poetry-app">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap');

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
}

body {
  font-family: 'Noto Serif SC', 'PingFang SC', 'SimSun', serif;
  background: var(--paper-cream);
  color: var(--ink-black);
  min-height: 100vh;
}

.poetry-app {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
}
</style>
