// client/src/composables/useAudio.js
import { ref, onUnmounted } from 'vue'

// 音效定义
const SFX_FILES = {
  correct: '/audio/sfx/correct.mp3',
  wrong: '/audio/sfx/wrong.mp3',
  complete: '/audio/sfx/complete.mp3',
  points: '/audio/sfx/points.mp3',
  levelup: '/audio/sfx/levelup.mp3'
}

// 背景音乐定义
const BGM_FILES = {
  'ocean-adventure': { name: '🌊 海洋冒险', file: '/audio/bgm/ocean-adventure.mp3' },
  'study-focus': { name: '🎹 学习专注', file: '/audio/bgm/study-focus.mp3' },
  'tropical-beach': { name: '🌴 热带海滩', file: '/audio/bgm/tropical-beach.mp3' },
  'dolphin-song': { name: '🐬 海豚之歌', file: '/audio/bgm/dolphin-song.mp3' },
  'deep-sea-calm': { name: '🌙 深海宁静', file: '/audio/bgm/deep-sea-calm.mp3' }
}

// 商店音乐 ID → 内部 BGM 名的映射
const SHOP_BGM_MAP = {
  'music_happy': 'ocean-adventure',
  'music_mystery': 'deep-sea-calm',
  'music_adventure': 'tropical-beach',
  'music_jazz': 'study-focus',
  'music_8bit': 'dolphin-song'
}

// 商店音效 ID → 内部 SFX 名的映射
const SHOP_SFX_MAP = {
  'sound_dolphin': 'complete',
  'sound_bubble': 'points',
  'sound_game': 'correct',
  'sound_magic': 'levelup',
  'sound_cat': 'wrong'
}

// 全局音频状态
const bgmAudio = ref(null)
const currentBgm = ref('')
const bgmVolume = ref(0.5)
const sfxVolume = ref(0.7)
const isBgmPlaying = ref(false)
const sfxEnabled = ref(true)
const equippedSfx = ref('none')  // 当前装备的商店音效

// 预加载音效缓存
const sfxCache = {}

export function useAudio() {
  // 预加载音效
  const preloadSfx = () => {
    Object.entries(SFX_FILES).forEach(([key, url]) => {
      if (!sfxCache[key]) {
        const audio = new Audio(url)
        audio.preload = 'auto'
        sfxCache[key] = audio
      }
    })
  }

  // 播放音效 — 如果装备了商店音效，优先使用映射
  const playSfx = (name) => {
    if (!sfxEnabled.value) return

    // 如果装备了商店音效且有映射，替换对应类型的音效
    let resolvedName = name
    if (equippedSfx.value && equippedSfx.value !== 'none') {
      const mappedSfx = SHOP_SFX_MAP[equippedSfx.value]
      if (mappedSfx) {
        // 根据原始请求类型智能替换
        if (name === 'correct' || name === 'complete' || name === 'points' || name === 'levelup') {
          resolvedName = mappedSfx
        }
        // wrong 音效保持不变（错误反馈不应被替换）
      }
    }
    
    const url = SFX_FILES[resolvedName]
    if (!url) {
      console.warn(`未知音效: ${resolvedName}`)
      return
    }

    let audio = sfxCache[resolvedName]
    if (audio) {
      audio = audio.cloneNode()
    } else {
      audio = new Audio(url)
    }
    
    audio.volume = sfxVolume.value
    audio.play().catch(e => console.warn('音效播放失败:', e))
  }

  // 播放背景音乐
  const playBgm = (name) => {
    const bgm = BGM_FILES[name]
    if (!bgm) {
      console.warn(`未知背景音乐: ${name}`)
      return
    }

    if (bgmAudio.value) {
      bgmAudio.value.pause()
      bgmAudio.value = null
    }

    const audio = new Audio(bgm.file)
    audio.volume = bgmVolume.value
    audio.loop = true
    
    audio.play().then(() => {
      bgmAudio.value = audio
      currentBgm.value = name
      isBgmPlaying.value = true
      localStorage.setItem('keke-bgm', name)
      localStorage.setItem('keke-bgm-volume', bgmVolume.value.toString())
    }).catch(e => {
      console.warn('背景音乐播放失败:', e)
    })
  }

  // 通过商店音乐 ID 播放 BGM
  const playBgmByShopId = (shopId) => {
    const mapped = SHOP_BGM_MAP[shopId]
    if (mapped) {
      playBgm(mapped)
    } else {
      console.warn(`未知商店音乐 ID: ${shopId}`)
    }
  }

  // 装备商店音效
  const equipShopSfx = (shopSfxId) => {
    equippedSfx.value = shopSfxId
    localStorage.setItem('keke-equipped-sfx', shopSfxId)
  }

  const pauseBgm = () => {
    if (bgmAudio.value) {
      bgmAudio.value.pause()
      isBgmPlaying.value = false
    }
  }

  const resumeBgm = () => {
    if (bgmAudio.value) {
      bgmAudio.value.play().then(() => {
        isBgmPlaying.value = true
      }).catch(e => console.warn('恢复播放失败:', e))
    }
  }

  const toggleBgm = () => {
    if (isBgmPlaying.value) {
      pauseBgm()
    } else if (bgmAudio.value) {
      resumeBgm()
    } else if (currentBgm.value) {
      playBgm(currentBgm.value)
    }
  }

  const setBgmVolume = (vol) => {
    bgmVolume.value = Math.max(0, Math.min(1, vol))
    if (bgmAudio.value) {
      bgmAudio.value.volume = bgmVolume.value
    }
    localStorage.setItem('keke-bgm-volume', bgmVolume.value.toString())
  }

  const setSfxVolume = (vol) => {
    sfxVolume.value = Math.max(0, Math.min(1, vol))
    localStorage.setItem('keke-sfx-volume', sfxVolume.value.toString())
  }

  const toggleSfx = () => {
    sfxEnabled.value = !sfxEnabled.value
    localStorage.setItem('keke-sfx-enabled', sfxEnabled.value.toString())
  }

  const loadPreferences = () => {
    const savedBgm = localStorage.getItem('keke-bgm')
    const savedBgmVol = localStorage.getItem('keke-bgm-volume')
    const savedSfxVol = localStorage.getItem('keke-sfx-volume')
    const savedSfxEnabled = localStorage.getItem('keke-sfx-enabled')
    const savedEquippedSfx = localStorage.getItem('keke-equipped-sfx')

    if (savedBgmVol) bgmVolume.value = parseFloat(savedBgmVol)
    if (savedSfxVol) sfxVolume.value = parseFloat(savedSfxVol)
    if (savedSfxEnabled !== null) sfxEnabled.value = savedSfxEnabled === 'true'
    if (savedBgm) currentBgm.value = savedBgm
    if (savedEquippedSfx) equippedSfx.value = savedEquippedSfx
  }

  const getBgmList = () => {
    return Object.entries(BGM_FILES).map(([key, value]) => ({
      id: key,
      name: value.name
    }))
  }

  preloadSfx()
  loadPreferences()

  onUnmounted(() => {
    if (bgmAudio.value) {
      bgmAudio.value.pause()
      bgmAudio.value = null
    }
  })

  return {
    currentBgm,
    bgmVolume,
    sfxVolume,
    isBgmPlaying,
    sfxEnabled,
    equippedSfx,
    playSfx,
    playBgm,
    playBgmByShopId,
    equipShopSfx,
    pauseBgm,
    resumeBgm,
    toggleBgm,
    setBgmVolume,
    setSfxVolume,
    toggleSfx,
    getBgmList
  }
}
