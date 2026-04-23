<template>
  <button
    class="duo-button"
    :class="[`variant-${variant}`, `size-${size}`, { 'is-disabled': disabled, 'is-loading': loading, 'is-block': block }]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="icon" class="duo-button__icon">{{ icon }}</span>
    <span class="duo-button__label"><slot /></span>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    // primary=绿, secondary=白底灰边, danger=红, warning=黄, info=蓝, ghost=透明
    validator: v => ['primary', 'secondary', 'danger', 'warning', 'info', 'ghost'].includes(v)
  },
  size: {
    type: String,
    default: 'medium',
    validator: v => ['small', 'medium', 'large'].includes(v)
  },
  icon: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false }
})

const emit = defineEmits(['click'])
const handleClick = (e) => emit('click', e)
</script>

<style scoped>
/* === Duolingo 招牌按钮：硬下沉阴影 === */
.duo-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: var(--duo-radius-md);
  font-family: var(--duo-font-display);
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: none;
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: transform 80ms ease, box-shadow 80ms ease, background 120ms ease;
  -webkit-tap-highlight-color: transparent;
}

.duo-button.is-block { display: flex; width: 100%; }

/* sizes */
.duo-button.size-small  { padding: 8px 16px;  font-size: 13px; min-height: 36px; }
.duo-button.size-medium { padding: 12px 20px; font-size: 15px; min-height: 46px; }
.duo-button.size-large  { padding: 16px 24px; font-size: 17px; min-height: 56px; }

/* variant: primary（绿） */
.duo-button.variant-primary {
  background: var(--duo-green);
  color: #fff;
  box-shadow: 0 4px 0 var(--duo-green-dark);
}
.duo-button.variant-primary:hover:not(:disabled) { background: var(--duo-green-light); }
.duo-button.variant-primary:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 var(--duo-green-dark); }

/* variant: secondary（白底灰边） */
.duo-button.variant-secondary {
  background: var(--duo-bg);
  color: var(--duo-text);
  border: 2px solid var(--duo-border);
  box-shadow: 0 4px 0 var(--duo-border);
}
.duo-button.variant-secondary:hover:not(:disabled) { background: var(--duo-bg-soft); }
.duo-button.variant-secondary:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 var(--duo-border); }

/* variant: danger（红） */
.duo-button.variant-danger {
  background: var(--duo-red);
  color: #fff;
  box-shadow: 0 4px 0 var(--duo-red-dark);
}
.duo-button.variant-danger:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 var(--duo-red-dark); }

/* variant: warning（黄） */
.duo-button.variant-warning {
  background: var(--duo-yellow);
  color: var(--duo-text);
  box-shadow: 0 4px 0 var(--duo-yellow-dark);
}
.duo-button.variant-warning:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 var(--duo-yellow-dark); }

/* variant: info（蓝） */
.duo-button.variant-info {
  background: var(--duo-blue);
  color: #fff;
  box-shadow: 0 4px 0 var(--duo-blue-dark);
}
.duo-button.variant-info:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 var(--duo-blue-dark); }

/* variant: ghost（无底） */
.duo-button.variant-ghost {
  background: transparent;
  color: var(--duo-text-soft);
  box-shadow: none;
}
.duo-button.variant-ghost:hover:not(:disabled) { background: var(--duo-bg-soft); }

/* disabled */
.duo-button.is-disabled,
.duo-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none !important;
  transform: none !important;
}

.duo-button__icon { font-size: 1.15em; line-height: 1; }
.duo-button__label { line-height: 1; }
</style>
