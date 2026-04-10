<template>
  <div class="duoduo" :class="[mood, { 'with-crown': showCrown }]">
    <svg viewBox="0 0 200 200" :width="size" :height="size">
      <ellipse cx="100" cy="110" rx="55" ry="45" fill="url(#bodyGradient)" />
      <ellipse cx="100" cy="120" rx="35" ry="30" fill="url(#bellyGradient)" />
      <path d="M100 65 Q110 45 100 25 Q90 45 100 65" fill="url(#finGradient)" />
      <path d="M155 110 Q180 100 175 85 Q165 95 155 90 Q160 100 155 110" fill="url(#finGradient)" />
      <path d="M155 110 Q180 120 175 135 Q165 125 155 130 Q160 120 155 110" fill="url(#finGradient)" />
      <ellipse cx="70" cy="115" rx="20" ry="8" fill="url(#finGradient)" transform="rotate(-30 70 115)" />
      <ellipse cx="55" cy="100" rx="25" ry="18" fill="url(#bodyGradient)" />
      <g class="eyes">
        <circle cx="70" cy="90" r="12" fill="white" />
        <circle cx="70" cy="90" r="8" fill="#1a1a1a" class="pupil" />
        <circle cx="73" cy="87" r="3" fill="white" />
      </g>
      <path class="mouth" :d="mouthPath" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" />
      <ellipse v-if="mood === 'happy' || mood === 'excited'" cx="75" cy="105" rx="8" ry="5" fill="rgba(255,150,150,0.5)" />
      <g v-if="showCrown" class="crown">
        <path d="M70 20 L80 40 L90 25 L100 40 L110 25 L120 40 L130 20 L125 50 L75 50 Z" fill="gold" stroke="#DAA520" stroke-width="2" />
        <circle cx="90" cy="35" r="4" fill="#FF6B6B" /><circle cx="100" cy="30" r="4" fill="#4ECDC4" /><circle cx="110" cy="35" r="4" fill="#FF6B6B" />
      </g>

      <!-- 皮肤装饰 -->
      <!-- 海盗帽 + 眼罩 -->
      <g v-if="skin === 'skin_pirate'">
        <path d="M55 60 Q65 30 100 25 Q135 30 145 60 L140 55 Q100 45 60 55 Z" fill="#2C2C2C" stroke="#1a1a1a" stroke-width="1.5" />
        <path d="M80 35 L90 15 L95 35" fill="white" />
        <rect x="48" y="85" width="18" height="12" rx="3" fill="#1a1a1a" />
        <line x1="56" y1="85" x2="42" y2="75" stroke="#1a1a1a" stroke-width="2" />
        <line x1="56" y1="85" x2="70" y2="75" stroke="#1a1a1a" stroke-width="2" />
      </g>
      <!-- 圣诞帽 + 红鼻子 -->
      <g v-if="skin === 'skin_santa'">
        <path d="M65 65 Q80 10 120 25 L125 30 Q90 20 75 60 Z" fill="#CC0000" stroke="#990000" stroke-width="1" />
        <circle cx="120" cy="25" r="8" fill="white" />
        <path d="M60 65 Q90 55 130 65" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" />
        <circle cx="60" cy="108" r="5" fill="#FF0000" />
      </g>
      <!-- 红色披风 -->
      <g v-if="skin === 'skin_superhero'">
        <path d="M80 110 Q75 130 60 170 Q90 160 100 155 Q110 160 140 170 Q125 130 120 110" fill="#CC0000" opacity="0.85" />
        <path d="M80 110 L120 110" stroke="#FFD700" stroke-width="3" />
      </g>
      <!-- 厨师帽 -->
      <g v-if="skin === 'skin_chef'">
        <ellipse cx="100" cy="40" rx="30" ry="25" fill="white" stroke="#ddd" stroke-width="1" />
        <rect x="72" y="50" width="56" height="15" rx="2" fill="white" stroke="#ddd" stroke-width="1" />
        <ellipse cx="85" cy="35" rx="12" ry="14" fill="white" />
        <ellipse cx="115" cy="35" rx="12" ry="14" fill="white" />
        <ellipse cx="100" cy="28" rx="12" ry="14" fill="white" />
      </g>
      <!-- 太空头盔 -->
      <g v-if="skin === 'skin_astronaut'">
        <ellipse cx="75" cy="90" rx="40" ry="38" fill="none" stroke="#ccc" stroke-width="4" />
        <ellipse cx="75" cy="90" rx="38" ry="36" fill="rgba(180,220,255,0.25)" />
        <path d="M37 90 Q35 75 40 60" stroke="#aaa" stroke-width="3" fill="none" />
        <path d="M113 90 Q115 75 110 60" stroke="#aaa" stroke-width="3" fill="none" />
      </g>
      <!-- 魔法帽 + 魔法杖 -->
      <g v-if="skin === 'skin_wizard'">
        <path d="M60 65 L95 5 L130 65 Z" fill="#4B0082" stroke="#6A0DAD" stroke-width="1.5" />
        <path d="M60 65 L130 65" stroke="#FFD700" stroke-width="4" />
        <circle cx="95" cy="30" r="4" fill="#FFD700" />
        <circle cx="88" cy="45" r="3" fill="#FFD700" opacity="0.7" />
        <circle cx="105" cy="50" r="2.5" fill="#FFD700" opacity="0.5" />
        <line x1="155" y1="60" x2="170" y2="20" stroke="#8B4513" stroke-width="3" stroke-linecap="round" />
        <circle cx="170" cy="18" r="5" fill="#FFD700">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </g>
      <!-- 礼帽 + 放大镜 -->
      <g v-if="skin === 'skin_detective'">
        <rect x="65" y="45" width="60" height="25" rx="4" fill="#2C2C2C" />
        <rect x="75" y="20" width="40" height="28" rx="3" fill="#2C2C2C" />
        <path d="M60 70 Q95 75 130 70" stroke="#2C2C2C" stroke-width="3" fill="none" />
        <circle cx="160" cy="105" r="14" fill="none" stroke="#8B4513" stroke-width="3" />
        <line x1="170" y1="115" x2="182" y2="130" stroke="#8B4513" stroke-width="4" stroke-linecap="round" />
        <circle cx="160" cy="105" r="11" fill="rgba(200,230,255,0.3)" />
      </g>
      <!-- 墨镜 + 吉他 -->
      <g v-if="skin === 'skin_rockstar'">
        <rect x="55" y="83" width="25" height="14" rx="5" fill="#1a1a1a" opacity="0.9" />
        <rect x="40" y="83" width="20" height="14" rx="5" fill="#1a1a1a" opacity="0.9" />
        <line x1="55" y1="90" x2="60" y2="90" stroke="#1a1a1a" stroke-width="2" />
        <ellipse cx="165" cy="135" rx="15" ry="10" fill="#8B4513" stroke="#654321" stroke-width="1.5" />
        <line x1="165" y1="125" x2="165" y2="75" stroke="#654321" stroke-width="3" />
        <line x1="160" y1="75" x2="170" y2="75" stroke="#654321" stroke-width="2" />
        <line x1="162" y1="130" x2="162" y2="80" stroke="#DAA520" stroke-width="0.5" />
        <line x1="168" y1="130" x2="168" y2="80" stroke="#DAA520" stroke-width="0.5" />
      </g>

      <defs>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4ECDC4" /><stop offset="50%" style="stop-color:#44A8A3" /><stop offset="100%" style="stop-color:#2E8B89" />
        </linearGradient>
        <linearGradient id="bellyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#B8E6E6" /><stop offset="100%" style="stop-color:#8DD9D9" />
        </linearGradient>
        <linearGradient id="finGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3DB8B4" /><stop offset="100%" style="stop-color:#2A9D99" />
        </linearGradient>
      </defs>
    </svg>
    <div v-if="message" class="message-bubble">{{ message }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  mood: { type: String, default: 'normal', validator: v => ['normal','happy','excited','encourage'].includes(v) },
  size: { type: Number, default: 120 },
  message: { type: String, default: '' },
  showCrown: { type: Boolean, default: false },
  skin: { type: String, default: 'default' }
})
const mouthPath = computed(() => {
  switch (props.mood) {
    case 'happy': case 'excited': return 'M45 105 Q55 115 65 105'
    case 'encourage': return 'M45 108 Q55 112 65 108'
    default: return 'M45 107 Q55 110 65 107'
  }
})
</script>

<style scoped>
.duoduo { position: relative; display: inline-block; animation: float 3s ease-in-out infinite; }
.duoduo.happy { animation: float 2s ease-in-out infinite, wiggle 0.5s ease-in-out; }
.duoduo.excited { animation: bounce 0.5s ease-in-out infinite; }
.duoduo.encourage { animation: nod 1s ease-in-out; }
.eyes { transition: transform 0.3s ease; }
.duoduo.excited .eyes { animation: blink 0.3s ease-in-out; }
.pupil { transition: transform 0.2s ease; }
.duoduo:hover .pupil { transform: translate(2px, 0); }
.crown { animation: crown-shine 1s ease-in-out infinite; }
.message-bubble { position: absolute; left: 100%; top: 20%; background: linear-gradient(135deg, #4ECDC4, #44A8A3); color: white; padding: 8px 14px; border-radius: 16px; font-size: 14px; white-space: nowrap; margin-left: 10px; box-shadow: 0 4px 12px rgba(78,205,196,0.3); animation: bubble-in 0.3s ease-out; }
.message-bubble::before { content: ''; position: absolute; left: -8px; top: 50%; transform: translateY(-50%); border: 8px solid transparent; border-right-color: #4ECDC4; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes bounce { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.05) translateY(-10px); } }
@keyframes wiggle { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } }
@keyframes nod { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(10deg); } 50% { transform: rotate(0); } 75% { transform: rotate(10deg); } }
@keyframes blink { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.1); } }
@keyframes crown-shine { 0%, 100% { filter: drop-shadow(0 0 5px gold); } 50% { filter: drop-shadow(0 0 15px gold); } }
@keyframes bubble-in { 0% { opacity: 0; transform: scale(0.8) translateX(-10px); } 100% { opacity: 1; transform: scale(1) translateX(0); } }
</style>
