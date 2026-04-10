<template>
  <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Soil gradients -->
      <radialGradient id="seed-soil" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#D2B48C" />
        <stop offset="50%" stop-color="#A0826A" />
        <stop offset="100%" stop-color="#8B6914" />
      </radialGradient>
      <linearGradient id="seed-soil-shadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6B4226" />
        <stop offset="100%" stop-color="#4A2E14" />
      </linearGradient>
      <!-- Sprout gradient -->
      <linearGradient id="seed-sprout" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#228B22" />
        <stop offset="40%" stop-color="#32CD32" />
        <stop offset="100%" stop-color="#90EE90" />
      </linearGradient>
      <!-- Leaf gradient -->
      <radialGradient id="seed-leaf" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#90EE90" />
        <stop offset="100%" stop-color="#32CD32" />
      </radialGradient>
      <!-- Glow filter -->
      <filter id="seed-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feFlood flood-color="#90EE90" flood-opacity="0.4" />
        <feComposite in2="blur" operator="in" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <!-- Soil texture -->
      <filter id="seed-texture">
        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" seed="2" />
        <feColorMatrix type="saturate" values="0" />
        <feBlend in="SourceGraphic" mode="multiply" />
      </filter>
      <!-- Shadow -->
      <filter id="seed-shadow">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#00000040" />
      </filter>
    </defs>

    <!-- Ground shadow -->
    <ellipse cx="200" cy="420" rx="130" ry="18" fill="#00000015" />

    <!-- Soil mound base (textured) -->
    <path
      d="M80,420 Q100,360 160,350 Q200,340 240,350 Q300,360 320,420 Q280,435 200,440 Q120,435 80,420Z"
      :fill="'url(#seed-soil)'"
      filter="url(#seed-texture)"
    />
    <!-- Soil mound highlight -->
    <path
      d="M110,400 Q150,365 200,358 Q250,365 290,400 Q250,410 200,412 Q150,410 110,400Z"
      fill="#C4A882"
      opacity="0.4"
    />
    <!-- Soil mound shadow bottom -->
    <path
      d="M90,418 Q140,430 200,435 Q260,430 310,418 Q280,440 200,445 Q120,440 90,418Z"
      fill="#5C3A1E"
      opacity="0.3"
    />

    <!-- Small stones -->
    <ellipse cx="120" cy="418" rx="8" ry="5" fill="#A0A0A0" opacity="0.7" />
    <ellipse cx="125" cy="416" rx="5" ry="3" fill="#C0C0C0" opacity="0.5" />
    <ellipse cx="275" cy="422" rx="6" ry="4" fill="#909090" opacity="0.6" />
    <ellipse cx="290" cy="425" rx="9" ry="5" fill="#B0B0B0" opacity="0.5" />
    <ellipse cx="170" cy="432" rx="5" ry="3" fill="#A8A8A8" opacity="0.5" />

    <!-- Soil crack details -->
    <path d="M150,390 Q160,395 155,405" stroke="#7A5C3A" stroke-width="0.8" fill="none" opacity="0.4" />
    <path d="M230,385 Q240,392 235,400" stroke="#7A5C3A" stroke-width="0.8" fill="none" opacity="0.4" />

    <!-- Sprout glow -->
    <ellipse cx="200" cy="340" rx="30" ry="40" fill="#90EE90" opacity="0.15" filter="url(#seed-glow)"
      :class="{ 'seed-pulse': animated }" />

    <!-- Sprout stem -->
    <path
      d="M200,395 Q198,375 202,355 Q204,345 200,335"
      stroke="url(#seed-sprout)"
      stroke-width="3.5"
      fill="none"
      stroke-linecap="round"
      :class="{ 'seed-sway': animated }"
    />

    <!-- Left leaf -->
    <g :class="{ 'seed-sway-leaf': animated }">
      <path
        d="M200,360 Q185,345 175,340 Q180,350 190,358 Z"
        fill="url(#seed-leaf)"
        stroke="#228B22"
        stroke-width="0.5"
      />
      <!-- Leaf vein -->
      <path d="M198,359 Q188,350 178,343" stroke="#228B22" stroke-width="0.5" fill="none" opacity="0.5" />
    </g>

    <!-- Right leaf -->
    <g :class="{ 'seed-sway-leaf-r': animated }">
      <path
        d="M202,350 Q218,335 228,332 Q220,345 210,350 Z"
        fill="url(#seed-leaf)"
        stroke="#228B22"
        stroke-width="0.5"
      />
      <!-- Leaf vein -->
      <path d="M204,349 Q215,339 225,335" stroke="#228B22" stroke-width="0.5" fill="none" opacity="0.5" />
    </g>

    <!-- Tiny top leaf bud -->
    <path
      d="M200,335 Q196,328 200,322 Q204,328 200,335Z"
      fill="#90EE90"
      :class="{ 'seed-sway': animated }"
    />
  </svg>
</template>

<script setup>
defineProps({
  animated: { type: Boolean, default: true }
})
</script>

<style scoped>
@keyframes seed-pulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.3; }
}
@keyframes seed-sway {
  0%, 100% { transform: rotate(0deg); transform-origin: 200px 395px; }
  25% { transform: rotate(2deg); transform-origin: 200px 395px; }
  75% { transform: rotate(-2deg); transform-origin: 200px 395px; }
}
@keyframes seed-sway-leaf {
  0%, 100% { transform: rotate(0deg); transform-origin: 200px 360px; }
  50% { transform: rotate(-3deg); transform-origin: 200px 360px; }
}
@keyframes seed-sway-leaf-r {
  0%, 100% { transform: rotate(0deg); transform-origin: 202px 350px; }
  50% { transform: rotate(3deg); transform-origin: 202px 350px; }
}
.seed-pulse { animation: seed-pulse 3s ease-in-out infinite; }
.seed-sway { animation: seed-sway 4s ease-in-out infinite; }
.seed-sway-leaf { animation: seed-sway-leaf 3.5s ease-in-out infinite; }
.seed-sway-leaf-r { animation: seed-sway-leaf-r 3.5s ease-in-out infinite 0.5s; }
</style>
