<template>
  <button 
    class="ocean-button"
    :class="[variant, size, { 'with-icon': !!icon }]"
    @click="handleClick"
  >
    <span v-if="icon" class="button-icon">{{ icon }}</span>
    <span class="button-text"><slot /></span>
    <span class="ripple" v-if="showRipple" :style="rippleStyle"></span>
  </button>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'success', 'coral', 'ghost'].includes(v)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (v) => ['small', 'medium', 'large'].includes(v)
  },
  icon: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['click'])

const showRipple = ref(false)
const rippleStyle = ref({})

const handleClick = (e) => {
  const button = e.currentTarget
  const rect = button.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  rippleStyle.value = {
    left: `${x}px`,
    top: `${y}px`
  }
  
  showRipple.value = true
  setTimeout(() => {
    showRipple.value = false
  }, 600)
  
  emit('click', e)
}
</script>

<style scoped>
.ocean-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: var(--radius-full);
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-md);
}

.ocean-button.small {
  padding: 8px 20px;
  font-size: 14px;
}

.ocean-button.medium {
  padding: 12px 28px;
  font-size: 16px;
}

.ocean-button.large {
  padding: 16px 36px;
  font-size: 18px;
}

.ocean-button.primary {
  background: var(--gradient-ocean);
  color: white;
}

.ocean-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.ocean-button.secondary {
  background: var(--foam);
  color: var(--ocean-deep);
  border: 2px solid var(--ocean-pale);
}

.ocean-button.secondary:hover {
  background: var(--ocean-pale);
  transform: translateY(-2px);
}

.ocean-button.success {
  background: var(--gradient-seaweed);
  color: white;
}

.ocean-button.success:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--shadow-seaweed);
}

.ocean-button.coral {
  background: var(--gradient-coral);
  color: white;
}

.ocean-button.coral:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--shadow-coral);
}

.ocean-button.ghost {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
  box-shadow: none;
}

.ocean-button.ghost:hover {
  background: rgba(255, 255, 255, 0.3);
}

.button-icon {
  font-size: 1.2em;
}

.ripple {
  position: absolute;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: ripple 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}

.ocean-button:active {
  transform: translateY(1px);
}
</style>
