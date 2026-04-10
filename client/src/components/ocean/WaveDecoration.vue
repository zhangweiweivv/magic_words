<template>
  <div class="wave-container" :class="position">
    <svg 
      class="wave wave-1" 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path 
        fill="var(--ocean-pale)" 
        fill-opacity="0.6"
        d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>
    <svg 
      class="wave wave-2" 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path 
        fill="var(--ocean-light)" 
        fill-opacity="0.4"
        d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,144C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>
    <svg 
      class="wave wave-3" 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path 
        fill="var(--ocean-medium)" 
        fill-opacity="0.3"
        d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,208C672,235,768,277,864,272C960,267,1056,213,1152,181.3C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>
  </div>
</template>

<script setup>
defineProps({
  position: {
    type: String,
    default: 'bottom',
    validator: (v) => ['top', 'bottom'].includes(v)
  }
})
</script>

<style scoped>
.wave-container {
  position: fixed;
  left: 0;
  width: 100%;
  height: 150px;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.wave-container.bottom {
  bottom: 0;
}

.wave-container.top {
  top: 0;
  transform: rotate(180deg);
}

.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 100%;
}

.wave-1 {
  animation: wave 12s linear infinite;
  z-index: 3;
}

.wave-2 {
  animation: wave 8s linear infinite reverse;
  z-index: 2;
  opacity: 0.8;
}

.wave-3 {
  animation: wave 15s linear infinite;
  z-index: 1;
  opacity: 0.6;
}

@keyframes wave {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
