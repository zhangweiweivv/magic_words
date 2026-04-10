<template>
  <div class="music-player">
    <button class="music-btn" @click="togglePanel" :class="{ playing: isBgmPlaying }">
      <span class="music-icon">{{ isBgmPlaying ? '🎵' : '🔇' }}</span>
    </button>

    <Transition name="slide">
      <div v-if="showPanel" class="music-panel">
        <div class="panel-header">
          <h3>🎶 背景音乐</h3>
          <button class="close-btn" @click="showPanel = false">✕</button>
        </div>

        <div class="music-list">
          <div v-for="bgm in bgmList" :key="bgm.id" :class="['music-item', { active: currentBgm === bgm.id }]" @click="selectBgm(bgm.id)">
            <span class="music-name">{{ bgm.name }}</span>
            <span v-if="currentBgm === bgm.id && isBgmPlaying" class="playing-indicator">
              <span class="bar"></span><span class="bar"></span><span class="bar"></span>
            </span>
          </div>
        </div>

        <div class="volume-section">
          <div class="volume-row">
            <span class="volume-label">🎵 音乐</span>
            <input type="range" min="0" max="100" :value="bgmVolume * 100" @input="setBgmVolume($event.target.value / 100)" class="volume-slider" />
            <span class="volume-value">{{ Math.round(bgmVolume * 100) }}%</span>
          </div>
          <div class="volume-row">
            <span class="volume-label">🔔 音效</span>
            <input type="range" min="0" max="100" :value="sfxVolume * 100" @input="setSfxVolume($event.target.value / 100)" class="volume-slider" />
            <span class="volume-value">{{ Math.round(sfxVolume * 100) }}%</span>
          </div>
        </div>

        <div class="control-row">
          <button class="control-btn" @click="toggleBgm">{{ isBgmPlaying ? '⏸️ 暂停' : '▶️ 播放' }}</button>
          <button class="control-btn" :class="{ active: sfxEnabled }" @click="toggleSfx">{{ sfxEnabled ? '🔊 音效开' : '🔇 音效关' }}</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAudio } from '../composables/useAudio'

const { currentBgm, bgmVolume, sfxVolume, isBgmPlaying, sfxEnabled, playBgm, toggleBgm, setBgmVolume, setSfxVolume, toggleSfx, getBgmList } = useAudio()

const showPanel = ref(false)
const bgmList = getBgmList()
const togglePanel = () => { showPanel.value = !showPanel.value }
const selectBgm = (id) => { playBgm(id) }
</script>

<style scoped>
.music-player { position: relative; }
.music-btn { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.3); cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; }
.music-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.1); }
.music-btn.playing { animation: pulse 2s ease-in-out infinite; }
.music-icon { font-size: 20px; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); } 50% { box-shadow: 0 0 0 10px rgba(255,255,255,0); } }
.music-panel { position: absolute; top: 50px; right: 0; width: 280px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; z-index: 1000; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: linear-gradient(135deg, #2ab7ca 0%, #1a7f9c 100%); color: white; }
.panel-header h3 { margin: 0; font-size: 16px; }
.close-btn { width: 28px; height: 28px; border: none; background: rgba(255,255,255,0.2); border-radius: 50%; color: white; cursor: pointer; font-size: 14px; }
.music-list { max-height: 200px; overflow-y: auto; }
.music-item { padding: 12px 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; }
.music-item:hover { background: #f5f5f5; }
.music-item.active { background: #e3f2fd; color: #1976d2; }
.music-name { font-size: 14px; }
.playing-indicator { display: flex; gap: 2px; height: 16px; align-items: flex-end; }
.bar { width: 3px; background: #1976d2; animation: bar-bounce 0.5s ease-in-out infinite; }
.bar:nth-child(1) { height: 8px; animation-delay: 0s; }
.bar:nth-child(2) { height: 12px; animation-delay: 0.1s; }
.bar:nth-child(3) { height: 6px; animation-delay: 0.2s; }
@keyframes bar-bounce { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.5); } }
.volume-section { padding: 12px 16px; border-top: 1px solid #eee; }
.volume-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.volume-row:last-child { margin-bottom: 0; }
.volume-label { font-size: 13px; min-width: 50px; }
.volume-slider { flex: 1; height: 4px; -webkit-appearance: none; background: #ddd; border-radius: 2px; outline: none; }
.volume-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: #2ab7ca; border-radius: 50%; cursor: pointer; }
.volume-value { font-size: 12px; color: #666; min-width: 35px; text-align: right; }
.control-row { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #eee; }
.control-btn { flex: 1; padding: 8px; border: none; border-radius: 8px; background: #f5f5f5; cursor: pointer; font-size: 13px; transition: all 0.2s; }
.control-btn:hover { background: #eee; }
.control-btn.active { background: #e3f2fd; color: #1976d2; }
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
