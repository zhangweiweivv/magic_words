<template>
  <canvas
    v-if="effectiveEnabled"
    ref="canvasEl"
    class="plum-rain-canvas"
    data-test="plum-rain-canvas"
    aria-hidden="true"
  ></canvas>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { plumRainEnabled, isReducedMotion, syncPlumRainEnabledFromStorage } from '../utils/plumRainSetting.js'

const canvasEl = ref(null)
const reducedMotion = ref(isReducedMotion())

const effectiveEnabled = computed(() => {
  return !!plumRainEnabled.value && !reducedMotion.value
})

let mql = null
let stop = null

function watchReducedMotion() {
  try {
    mql = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mql) return

    const update = () => {
      reducedMotion.value = !!mql.matches
      if (reducedMotion.value && stop) stop()
    }

    // initial
    update()

    if (mql.addEventListener) mql.addEventListener('change', update)
    else if (mql.addListener) mql.addListener(update)

    return () => {
      if (mql?.removeEventListener) mql.removeEventListener('change', update)
      else if (mql?.removeListener) mql.removeListener(update)
    }
  } catch {
    return null
  }
}

// Animation will be implemented in follow-up commits.
function startIfNeeded() {
  if (import.meta.env.MODE === 'test') return
  // placeholder
  stop = () => {}
}

onMounted(() => {
  // Make sure we pick up latest localStorage value (tests and same-tab toggles)
  syncPlumRainEnabledFromStorage()

  const unwatch = watchReducedMotion()
  startIfNeeded()
  onUnmounted(() => {
    if (unwatch) unwatch()
    if (stop) stop()
  })
})
</script>

<style scoped>
.plum-rain-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 999;
}
</style>
