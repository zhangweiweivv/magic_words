<template>
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="can-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#64B5F6" />
        <stop offset="30%" stop-color="#42A5F5" />
        <stop offset="70%" stop-color="#2196F3" />
        <stop offset="100%" stop-color="#1976D2" />
      </linearGradient>
      <linearGradient id="can-body-highlight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#BBDEFB" stop-opacity="0.5" />
        <stop offset="50%" stop-color="#E3F2FD" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#BBDEFB" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="can-spout" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#42A5F5" />
        <stop offset="100%" stop-color="#1976D2" />
      </linearGradient>
      <linearGradient id="can-handle" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1E88E5" />
        <stop offset="100%" stop-color="#1565C0" />
      </linearGradient>
      <linearGradient id="water-stream" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#64B5F6" />
        <stop offset="50%" stop-color="#90CAF9" />
        <stop offset="100%" stop-color="#BBDEFB" />
      </linearGradient>
      <filter id="can-shadow">
        <feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="#00000025" />
      </filter>
      <filter id="water-blur">
        <feGaussianBlur stdDeviation="1" />
      </filter>
    </defs>

    <g filter="url(#can-shadow)">
      <!-- Can body (rounded shape) -->
      <path
        d="M55,75 Q55,65 65,60 L120,60 Q130,65 130,75 L130,145 Q130,155 120,158 L65,158 Q55,155 55,145Z"
        fill="url(#can-body)" />
      <!-- Body highlight -->
      <path
        d="M60,70 Q60,65 68,62 L85,62 Q75,65 75,72 L75,148 Q75,152 80,155 L68,155 Q60,152 60,145Z"
        fill="url(#can-body-highlight)" />

      <!-- Decorative band top -->
      <path d="M55,78 Q55,76 65,74 L120,74 Q130,76 130,78 L130,82 Q130,80 120,78 L65,78 Q55,80 55,82Z"
        fill="#1565C0" opacity="0.3" />
      <!-- Decorative band bottom -->
      <path d="M55,138 Q55,136 65,134 L120,134 Q130,136 130,138 L130,142 Q130,140 120,138 L65,138 Q55,140 55,142Z"
        fill="#1565C0" opacity="0.3" />

      <!-- Small flower decoration on body -->
      <g transform="translate(92, 108)">
        <circle cx="4" cy="0" r="3" fill="#FFB7C5" opacity="0.7" />
        <circle cx="-4" cy="0" r="3" fill="#FFB7C5" opacity="0.7" />
        <circle cx="0" cy="4" r="3" fill="#FFB7C5" opacity="0.7" />
        <circle cx="0" cy="-4" r="3" fill="#FFB7C5" opacity="0.7" />
        <circle cx="0" cy="0" r="2" fill="#FFE082" />
      </g>
      <!-- Small leaf -->
      <path d="M100,115 Q105,112 108,115 Q105,118 100,115Z" fill="#81C784" opacity="0.7" />
      <path d="M84,102 Q87,98 90,102 Q87,105 84,102Z" fill="#81C784" opacity="0.6" />

      <!-- Spout -->
      <path
        d="M130,72 Q135,70 145,62 Q155,55 165,52 Q168,51 168,54 Q165,56 158,60 Q148,66 140,72 Q135,76 130,78Z"
        fill="url(#can-spout)" />
      <!-- Spout opening -->
      <ellipse cx="167" cy="53" rx="3" ry="2" fill="#1565C0" />

      <!-- Handle -->
      <path
        d="M55,82 Q40,82 35,95 Q32,108 35,120 Q40,132 55,132"
        stroke="url(#can-handle)" stroke-width="6" fill="none" stroke-linecap="round" />
      <!-- Handle highlight -->
      <path
        d="M55,85 Q43,85 39,96 Q36,108 39,118 Q43,128 55,129"
        stroke="#90CAF9" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.4" />

      <!-- Top rim -->
      <path d="M55,62 Q55,58 65,56 L120,56 Q130,58 130,62 L130,65 Q130,61 120,59 L65,59 Q55,61 55,65Z"
        fill="#1E88E5" />
    </g>

    <!-- Water stream (conditional) -->
    <g v-if="pouring" :class="{ 'water-pour': animated }">
      <!-- Main water stream -->
      <path
        d="M167,55 Q170,65 172,80 Q175,100 178,120 Q180,140 182,160 Q183,170 184,180"
        stroke="url(#water-stream)" stroke-width="3" fill="none" stroke-linecap="round"
        filter="url(#water-blur)" opacity="0.7" />
      <!-- Splash drops -->
      <circle cx="180" cy="175" r="2" fill="#90CAF9" opacity="0.5"
        :class="{ 'water-drop-1': animated }" />
      <circle cx="186" cy="172" r="1.5" fill="#BBDEFB" opacity="0.4"
        :class="{ 'water-drop-2': animated }" />
      <circle cx="176" cy="178" r="1.5" fill="#64B5F6" opacity="0.4"
        :class="{ 'water-drop-3': animated }" />
      <!-- Smaller drips -->
      <path d="M170,70 Q171,75 172,82" stroke="#90CAF9" stroke-width="1.5" fill="none" opacity="0.4"
        :class="{ 'water-drip': animated }" />
    </g>
  </svg>
</template>

<script setup>
defineProps({
  animated: { type: Boolean, default: true },
  pouring: { type: Boolean, default: false }
})
</script>

<style scoped>
@keyframes water-pour {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 0.9; }
}
@keyframes water-drop-1 {
  0% { transform: translate(0, 0) scale(1); opacity: 0.5; }
  50% { transform: translate(-5px, 8px) scale(1.2); opacity: 0.3; }
  100% { transform: translate(-8px, 15px) scale(0.5); opacity: 0; }
}
@keyframes water-drop-2 {
  0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
  50% { transform: translate(4px, 6px) scale(1.1); opacity: 0.25; }
  100% { transform: translate(6px, 12px) scale(0.4); opacity: 0; }
}
@keyframes water-drop-3 {
  0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
  50% { transform: translate(-3px, 5px) scale(1); opacity: 0.2; }
  100% { transform: translate(-5px, 10px) scale(0.3); opacity: 0; }
}
@keyframes water-drip {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.2; }
}
.water-pour { animation: water-pour 2s ease-in-out infinite; }
.water-drop-1 { animation: water-drop-1 1.5s ease-out infinite; }
.water-drop-2 { animation: water-drop-2 1.5s ease-out infinite 0.3s; }
.water-drop-3 { animation: water-drop-3 1.5s ease-out infinite 0.6s; }
.water-drip { animation: water-drip 1s ease-in-out infinite; }
</style>
