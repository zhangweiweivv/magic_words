// client/src/composables/useEffects.js
import { ref, computed } from 'vue'

const EFFECTS = {
  basic: ['star-burst', 'wave-ripple', 'rainbow-ring', 'bubble-rise'],
  streak: {
    3: 'fire-blast',
    5: 'rainbow-bridge',
    10: 'fireworks',
    20: 'ocean-king'
  }
}

// 商店特效 ID → 内部特效名的映射
const SHOP_EFFECT_MAP = {
  'default': 'star-burst',
  'effect_rainbow': 'rainbow-ring',
  'effect_firework': 'fireworks',
  'effect_meteor': 'star-burst',
  'effect_sakura': 'bubble-rise',
  'effect_coins': 'star-burst',
  'effect_hearts': 'rainbow-ring',
  'effect_lightning': 'fire-blast',
  'effect_stars': 'star-burst',
  'effect_bubbles': 'bubble-rise',
  'effect_snow': 'bubble-rise',
  'effect_confetti': 'rainbow-bridge',
  'effect_butterfly': 'bubble-rise',
  'effect_fire': 'fire-blast',
  'effect_magic': 'rainbow-ring',
  'effect_unicorn': 'ocean-king'
}

const currentStreak = ref(0)
const activeEffects = ref([])
const equippedEffect = ref('star-burst')
let effectId = 0

export function useEffects() {
  const triggerEffect = (effectName, options = {}) => {
    const id = ++effectId
    const effect = {
      id,
      name: effectName,
      x: options.x || window.innerWidth / 2,
      y: options.y || window.innerHeight / 2,
      createdAt: Date.now()
    }
    
    activeEffects.value.push(effect)
    
    const duration = options.duration || 2000
    setTimeout(() => {
      activeEffects.value = activeEffects.value.filter(e => e.id !== id)
    }, duration)
    
    return id
  }

  const onCorrect = (options = {}) => {
    currentStreak.value++
    
    const streakEffect = EFFECTS.streak[currentStreak.value]
    if (streakEffect) {
      triggerEffect(streakEffect, { ...options, duration: 3000 })
    } else {
      triggerEffect(equippedEffect.value, options)
    }
    
    return currentStreak.value
  }

  const onWrong = () => {
    currentStreak.value = 0
  }

  const resetStreak = () => {
    currentStreak.value = 0
  }

  const equipEffect = (effectName) => {
    // 支持商店特效 ID 和内部特效名
    const mapped = SHOP_EFFECT_MAP[effectName]
    if (mapped) {
      equippedEffect.value = mapped
      localStorage.setItem('keke-equipped-effect', effectName)
      return
    }
    if (EFFECTS.basic.includes(effectName)) {
      equippedEffect.value = effectName
      localStorage.setItem('keke-equipped-effect', effectName)
    }
  }

  const loadPreferences = () => {
    const saved = localStorage.getItem('keke-equipped-effect')
    if (saved) {
      // 优先尝试商店映射
      const mapped = SHOP_EFFECT_MAP[saved]
      if (mapped) {
        equippedEffect.value = mapped
      } else if (EFFECTS.basic.includes(saved)) {
        equippedEffect.value = saved
      }
    }
  }

  const getBasicEffects = () => EFFECTS.basic
  const getStreakEffects = () => EFFECTS.streak

  const streakLevel = computed(() => {
    if (currentStreak.value >= 20) return 4
    if (currentStreak.value >= 10) return 3
    if (currentStreak.value >= 5) return 2
    if (currentStreak.value >= 3) return 1
    return 0
  })

  loadPreferences()

  return {
    currentStreak,
    activeEffects,
    equippedEffect,
    streakLevel,
    triggerEffect,
    onCorrect,
    onWrong,
    resetStreak,
    equipEffect,
    getBasicEffects,
    getStreakEffects
  }
}
