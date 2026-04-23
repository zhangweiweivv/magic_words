<template>
  <component
    :is="tag"
    class="duo-card"
    :class="[`accent-${accent}`, { 'is-clickable': clickable, 'is-flat': flat, 'is-soft': soft }]"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

<script setup>
defineProps({
  // 点缀色：决定左侧色条 / 顶部色块
  accent: {
    type: String,
    default: 'none',
    validator: v => ['none', 'green', 'yellow', 'blue', 'red', 'orange', 'purple'].includes(v)
  },
  clickable: { type: Boolean, default: false },
  flat: { type: Boolean, default: false },          // 不带下沉阴影
  soft: { type: Boolean, default: false },          // 浅灰底
  tag: { type: String, default: 'div' }
})

const emit = defineEmits(['click'])
const handleClick = (e) => emit('click', e)
</script>

<style scoped>
.duo-card {
  background: var(--duo-bg-card);
  border: 2px solid var(--duo-border);
  border-radius: var(--duo-radius-lg);
  padding: 16px;
  box-shadow: 0 2px 0 var(--duo-border);
  transition: transform 80ms ease, box-shadow 80ms ease, background 120ms ease;
  position: relative;
}

.duo-card.is-flat { box-shadow: none; }
.duo-card.is-soft { background: var(--duo-bg-soft); }

.duo-card.is-clickable {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.duo-card.is-clickable:hover { background: var(--duo-bg-soft); }
.duo-card.is-clickable:active { transform: translateY(2px); box-shadow: 0 0 0 var(--duo-border); }

/* accent 色条（顶部 4px） */
.duo-card.accent-green   { border-top-color: var(--duo-green);  border-top-width: 4px; }
.duo-card.accent-yellow  { border-top-color: var(--duo-yellow); border-top-width: 4px; }
.duo-card.accent-blue    { border-top-color: var(--duo-blue);   border-top-width: 4px; }
.duo-card.accent-red     { border-top-color: var(--duo-red);    border-top-width: 4px; }
.duo-card.accent-orange  { border-top-color: var(--duo-orange); border-top-width: 4px; }
.duo-card.accent-purple  { border-top-color: var(--duo-purple); border-top-width: 4px; }
</style>
