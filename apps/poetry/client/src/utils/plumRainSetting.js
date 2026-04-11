import { ref } from 'vue'

export const PLUM_RAIN_STORAGE_KEY = 'poetry.effects.plumRain.enabled'

function readStoredEnabled() {
  try {
    const v = globalThis.localStorage?.getItem(PLUM_RAIN_STORAGE_KEY)
    if (v == null) return true // default on
    if (v === 'true' || v === '1') return true
    if (v === 'false' || v === '0') return false
    return true
  } catch {
    return true
  }
}

export const plumRainEnabled = ref(readStoredEnabled())

export function syncPlumRainEnabledFromStorage() {
  plumRainEnabled.value = readStoredEnabled()
}

export function setPlumRainEnabled(value) {
  plumRainEnabled.value = !!value
  try {
    globalThis.localStorage?.setItem(PLUM_RAIN_STORAGE_KEY, plumRainEnabled.value ? 'true' : 'false')
  } catch {
    // ignore
  }
}

export function isReducedMotion() {
  try {
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  } catch {
    return false
  }
}
