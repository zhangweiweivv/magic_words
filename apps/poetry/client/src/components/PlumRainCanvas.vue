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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { plumRainEnabled, isReducedMotion, syncPlumRainEnabledFromStorage } from '../utils/plumRainSetting.js'

const canvasEl = ref(null)
const reducedMotion = ref(isReducedMotion())

const effectiveEnabled = computed(() => {
  return !!plumRainEnabled.value && !reducedMotion.value
})

let mql = null
let unwatchReducedMotion = null

let rafId = null
let timerId = null
let running = false
let lastT = 0

let burstActive = false
let burstEndAt = 0
let burstTarget = 0
let spawnedThisBurst = 0

let particles = []

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

function isHidden() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

function resizeCanvas() {
  const canvas = canvasEl.value
  if (!canvas) return
  const dpr = clamp(window.devicePixelRatio || 1, 1, 2)
  const w = Math.floor(window.innerWidth)
  const h = Math.floor(window.innerHeight)
  canvas.width = Math.floor(w * dpr)
  canvas.height = Math.floor(h * dpr)
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function drawPlum(ctx, size) {
  // Draw a simplified 5-petal plum blossom around origin.
  const petalW = size * 0.52
  const petalH = size * 0.9

  for (let i = 0; i < 5; i++) {
    ctx.save()
    ctx.rotate((Math.PI * 2 * i) / 5)
    ctx.beginPath()
    // Petal as an ellipse offset from center
    ctx.ellipse(0, -size * 0.55, petalW, petalH, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // center
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2)
  ctx.fill()
}

function spawnOne(now, layer = 0) {
  const canvas = canvasEl.value
  if (!canvas) return null

  const w = window.innerWidth
  const h = window.innerHeight

  const depth = layer === 0 ? rand(0.6, 1.0) : rand(0.3, 0.6)
  const size = rand(6, 12) * depth
  const x = rand(-20, w + 20)
  const y = rand(-h * 0.15, -20)

  const wind = rand(-18, -8) // drift left
  const fall = rand(22, 44)

  return {
    x,
    y,
    vx: wind * (0.6 + depth),
    vy: fall * (0.6 + depth),
    size,
    rot: rand(0, Math.PI * 2),
    rotSpeed: rand(-1.2, 1.2) * depth,
    alpha: rand(0.12, 0.24) * depth,
    swayPhase: rand(0, Math.PI * 2),
    swayAmp: rand(6, 16) * (1 - depth),
    hue: rand(340, 10),
    depth
  }
}

function startBurst() {
  if (!effectiveEnabled.value || isHidden()) return
  burstActive = true
  spawnedThisBurst = 0

  const isMobile = window.innerWidth < 480
  burstTarget = Math.floor(rand(isMobile ? 12 : 18, isMobile ? 18 : 28))
  burstEndAt = performance.now() + rand(4000, 8000)

  if (!running) startLoop()
}

function scheduleNextBurst() {
  clearTimeout(timerId)
  if (!effectiveEnabled.value) return
  const delay = Math.floor(rand(20000, 60000))
  timerId = setTimeout(startBurst, delay)
}

function updateParticles(dt, now) {
  const w = window.innerWidth
  const h = window.innerHeight

  // spawn during burst
  if (burstActive) {
    const remaining = burstTarget - spawnedThisBurst
    // spawn a few per frame
    const spawnN = Math.min(remaining, Math.max(1, Math.floor(remaining / 10)))
    for (let i = 0; i < spawnN; i++) {
      const layer = Math.random() < 0.3 ? 1 : 0
      const p = spawnOne(now, layer)
      if (p) {
        particles.push(p)
        spawnedThisBurst++
      }
    }

    if (now >= burstEndAt || spawnedThisBurst >= burstTarget) {
      burstActive = false
    }
  }

  // update
  const alive = []
  for (const p of particles) {
    const sway = Math.sin(now / 1000 + p.swayPhase) * p.swayAmp
    p.x += (p.vx * dt) / 1000 + sway * (dt / 1000)
    p.y += (p.vy * dt) / 1000
    p.rot += (p.rotSpeed * dt) / 1000

    if (p.y < h + 40 && p.x > -80 && p.x < w + 80) {
      alive.push(p)
    }
  }
  particles = alive
}

function render(now) {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // clear
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

  for (const p of particles) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)

    // plum palette (very restrained)
    const fill = p.depth > 0.7 ? 'rgba(192, 57, 43, 0.30)' : 'rgba(212, 168, 67, 0.18)'

    ctx.globalAlpha = p.alpha
    ctx.fillStyle = fill
    drawPlum(ctx, p.size)

    // center dot slightly darker
    ctx.globalAlpha = p.alpha * 0.9
    ctx.fillStyle = 'rgba(44, 44, 44, 0.22)'
    ctx.beginPath()
    ctx.arc(0, 0, p.size * 0.12, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

function tick(t) {
  if (!running) return
  if (!effectiveEnabled.value || isHidden()) {
    stopLoop()
    return
  }

  const now = t || performance.now()
  const dt = lastT ? now - lastT : 16
  lastT = now

  updateParticles(dt, now)
  render(now)

  if (particles.length > 0 || burstActive) {
    rafId = requestAnimationFrame(tick)
  } else {
    stopLoop()
    scheduleNextBurst()
  }
}

function startLoop() {
  if (running) return
  if (!effectiveEnabled.value) return
  running = true
  lastT = 0
  rafId = requestAnimationFrame(tick)
}

function stopLoop() {
  running = false
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
}

function stopAll() {
  clearTimeout(timerId)
  timerId = null
  stopLoop()
  burstActive = false
  particles = []
}

function watchReducedMotion() {
  try {
    mql = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mql) return null

    const update = () => {
      reducedMotion.value = !!mql.matches
      if (reducedMotion.value) stopAll()
    }

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

function onVisibilityChange() {
  if (isHidden()) {
    stopLoop()
  } else {
    // restart scheduling (don’t force immediate burst)
    if (effectiveEnabled.value) scheduleNextBurst()
  }
}

onMounted(() => {
  // Make sure we pick up latest localStorage value (tests and same-tab toggles)
  syncPlumRainEnabledFromStorage()

  unwatchReducedMotion = watchReducedMotion()

  // no animation during tests
  if (import.meta.env.MODE !== 'test') {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    document.addEventListener('visibilitychange', onVisibilityChange)
    scheduleNextBurst()
  }

  watch(
    () => effectiveEnabled.value,
    (enabled) => {
      if (import.meta.env.MODE === 'test') return
      if (enabled) {
        resizeCanvas()
        scheduleNextBurst()
      } else {
        stopAll()
      }
    }
  )
})

onUnmounted(() => {
  if (unwatchReducedMotion) unwatchReducedMotion()
  stopAll()
  window.removeEventListener('resize', resizeCanvas)
  document.removeEventListener('visibilitychange', onVisibilityChange)
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
