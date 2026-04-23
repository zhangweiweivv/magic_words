<template>
  <div class="kitty" :class="[mood]" :style="{ width: size + 'px', height: size + 'px' }">
    <svg viewBox="0 0 200 200" :width="size" :height="size" xmlns="http://www.w3.org/2000/svg">
      <!-- 尾巴 -->
      <path d="M155 145 Q190 130 185 95 Q180 80 165 90"
            fill="none" stroke="#F5A841" stroke-width="14"
            stroke-linecap="round" class="tail" />

      <!-- 身体 -->
      <ellipse cx="100" cy="135" rx="55" ry="45" fill="#FFB84D" />
      <!-- 肚皮 -->
      <ellipse cx="100" cy="145" rx="32" ry="28" fill="#FFE0B2" />

      <!-- 后腿（左右） -->
      <ellipse cx="65" cy="170" rx="14" ry="10" fill="#F5A841" />
      <ellipse cx="135" cy="170" rx="14" ry="10" fill="#F5A841" />

      <!-- 头 -->
      <circle cx="100" cy="80" r="48" fill="#FFB84D" />

      <!-- 耳朵 -->
      <path d="M62 50 L55 18 L82 42 Z" fill="#FFB84D" />
      <path d="M138 50 L145 18 L118 42 Z" fill="#FFB84D" />
      <!-- 耳朵内侧 -->
      <path d="M68 45 L62 28 L78 42 Z" fill="#FF9999" />
      <path d="M132 45 L138 28 L122 42 Z" fill="#FF9999" />

      <!-- 脸颊腮红 -->
      <ellipse cx="68" cy="92" rx="9" ry="5" fill="#FFB3B3" opacity="0.7" />
      <ellipse cx="132" cy="92" rx="9" ry="5" fill="#FFB3B3" opacity="0.7" />

      <!-- 眼睛 -->
      <g class="eyes">
        <!-- 闭眼（happy/excited） -->
        <template v-if="mood === 'excited' || mood === 'happy'">
          <path d="M75 78 Q82 70 89 78" fill="none" stroke="#3C3C3C" stroke-width="3" stroke-linecap="round" />
          <path d="M111 78 Q118 70 125 78" fill="none" stroke="#3C3C3C" stroke-width="3" stroke-linecap="round" />
        </template>
        <!-- 睁眼 -->
        <template v-else>
          <ellipse cx="82" cy="80" rx="6" ry="9" fill="#3C3C3C" />
          <ellipse cx="118" cy="80" rx="6" ry="9" fill="#3C3C3C" />
          <circle cx="84" cy="76" r="2.5" fill="#fff" />
          <circle cx="120" cy="76" r="2.5" fill="#fff" />
        </template>
      </g>

      <!-- 鼻子 -->
      <path d="M97 92 L103 92 L100 96 Z" fill="#FF6B9D" />

      <!-- 嘴 -->
      <path v-if="mood === 'sad'"
            d="M93 105 Q100 100 107 105" fill="none" stroke="#3C3C3C" stroke-width="2" stroke-linecap="round" />
      <path v-else
            d="M93 100 Q97 105 100 100 Q103 105 107 100"
            fill="none" stroke="#3C3C3C" stroke-width="2" stroke-linecap="round" />

      <!-- 胡须 -->
      <g stroke="#3C3C3C" stroke-width="1.2" stroke-linecap="round" opacity="0.7">
        <line x1="58" y1="96" x2="42" y2="93" />
        <line x1="58" y1="100" x2="42" y2="100" />
        <line x1="142" y1="96" x2="158" y2="93" />
        <line x1="142" y1="100" x2="158" y2="100" />
      </g>

      <!-- 皇冠（可选） -->
      <g v-if="showCrown">
        <path d="M72 24 L82 38 L92 22 L100 38 L108 22 L118 38 L128 24 L124 48 L76 48 Z"
              fill="#FFD700" stroke="#E6A700" stroke-width="2" />
        <circle cx="92" cy="32" r="3" fill="#FF4B4B" />
        <circle cx="100" cy="28" r="3" fill="#1CB0F6" />
        <circle cx="108" cy="32" r="3" fill="#FF4B4B" />
      </g>
    </svg>

    <!-- 对话气泡 -->
    <div v-if="message" class="bubble">{{ message }}</div>
  </div>
</template>

<script setup>
defineProps({
  mood: {
    type: String,
    default: 'happy',
    validator: v => ['happy', 'excited', 'thinking', 'sad', 'normal'].includes(v)
  },
  size: { type: Number, default: 120 },
  message: { type: String, default: '' },
  showCrown: { type: Boolean, default: false }
})
</script>

<style scoped>
.kitty {
  position: relative;
  display: inline-block;
}

.kitty svg {
  display: block;
  animation: kitty-breathe 3s ease-in-out infinite;
}

.kitty.excited svg { animation: kitty-bounce 0.6s ease-in-out infinite; }
.kitty.thinking svg { animation: kitty-tilt 4s ease-in-out infinite; }

@keyframes kitty-breathe {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-3px) scale(1.02); }
}
@keyframes kitty-bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
@keyframes kitty-tilt {
  0%, 100% { transform: rotate(-2deg); }
  50%      { transform: rotate(2deg); }
}

.tail { animation: tail-wag 2.5s ease-in-out infinite; transform-origin: 165px 130px; }
@keyframes tail-wag {
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(8deg); }
}

.bubble {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: #fff;
  color: var(--duo-text);
  font-family: var(--duo-font-display);
  font-weight: 700;
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 16px;
  border: 2px solid var(--duo-border);
  box-shadow: 0 2px 0 var(--duo-border);
  white-space: nowrap;
  max-width: 220px;
  white-space: normal;
  text-align: center;
  animation: bubble-pop 0.4s ease-out;
}
.bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: var(--duo-border);
}
@keyframes bubble-pop {
  from { transform: translateX(-50%) translateY(0) scale(0.8); opacity: 0; }
  to   { transform: translateX(-50%) translateY(-8px) scale(1); opacity: 1; }
}
</style>
