<template>
  <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="small-trunk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#6B3A1F" />
        <stop offset="30%" stop-color="#8B4513" />
        <stop offset="70%" stop-color="#A0522D" />
        <stop offset="100%" stop-color="#7A4420" />
      </linearGradient>
      <radialGradient id="small-canopy" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#90EE90" />
        <stop offset="40%" stop-color="#32CD32" />
        <stop offset="75%" stop-color="#228B22" />
        <stop offset="100%" stop-color="#1B5E20" />
      </radialGradient>
      <radialGradient id="small-canopy-light" cx="35%" cy="30%" r="40%">
        <stop offset="0%" stop-color="#C8E6C9" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#90EE90" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="small-soil" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#D2B48C" />
        <stop offset="100%" stop-color="#8B6914" />
      </radialGradient>
      <filter id="small-shadow">
        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#00000030" />
      </filter>
      <filter id="small-bark">
        <feTurbulence type="fractalNoise" baseFrequency="0.15 0.8" numOctaves="4" seed="3" />
        <feColorMatrix type="saturate" values="0.2" />
        <feBlend in="SourceGraphic" mode="multiply" />
      </filter>
    </defs>

    <!-- Ground shadow -->
    <ellipse cx="200" cy="460" rx="120" ry="18" fill="#00000012" />

    <!-- Small grass tufts at base -->
    <g opacity="0.7">
      <path d="M145,455 Q148,440 150,430 Q150,442 153,455" fill="#43A047" />
      <path d="M155,453 Q156,438 160,428 Q159,440 162,453" fill="#66BB6A" />
      <path d="M240,456 Q243,442 247,432 Q246,444 249,456" fill="#43A047" />
      <path d="M250,455 Q252,443 255,435 Q254,445 257,455" fill="#66BB6A" />
      <path d="M170,458 Q172,448 175,440 Q174,449 177,458" fill="#4CAF50" />
    </g>

    <!-- Trunk with bark texture -->
    <path
      d="M188,455 Q185,420 183,380 Q180,340 185,310 Q188,295 192,280
         L208,280 Q212,295 215,310 Q220,340 217,380 Q215,420 212,455Z"
      fill="url(#small-trunk)"
      filter="url(#small-bark)"
    />
    <!-- Bark detail lines -->
    <path d="M192,440 Q195,420 193,400" stroke="#5C2E0E" stroke-width="0.8" fill="none" opacity="0.4" />
    <path d="M205,435 Q207,415 204,395" stroke="#5C2E0E" stroke-width="0.8" fill="none" opacity="0.4" />
    <path d="M198,380 Q200,360 197,340" stroke="#5C2E0E" stroke-width="0.6" fill="none" opacity="0.3" />
    <!-- Trunk highlight -->
    <path
      d="M195,450 Q193,400 195,350 Q197,310 200,280
         L203,280 Q200,310 198,350 Q196,400 198,450Z"
      fill="#CD853F" opacity="0.2"
    />

    <!-- Small branch left -->
    <path d="M186,320 Q170,305 155,300" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round" />
    <!-- Small branch right -->
    <path d="M214,310 Q230,298 242,295" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round" />

    <!-- Main canopy (multiple overlapping shapes) -->
    <g filter="url(#small-shadow)">
      <!-- Back canopy layer -->
      <ellipse cx="200" cy="230" rx="95" ry="85" fill="url(#small-canopy)" />
      <!-- Right bump -->
      <circle cx="260" cy="245" r="50" fill="#228B22" />
      <!-- Left bump -->
      <circle cx="145" cy="250" r="45" fill="#1B8C1B" />
      <!-- Top bump -->
      <circle cx="200" cy="175" r="55" fill="#2E9B2E" />
      <!-- Top-right bump -->
      <circle cx="240" cy="195" r="40" fill="#28A428" />
      <!-- Top-left bump -->
      <circle cx="160" cy="200" r="42" fill="#259425" />
    </g>

    <!-- Canopy light overlay -->
    <ellipse cx="185" cy="210" rx="60" ry="55" fill="url(#small-canopy-light)" />

    <!-- Canopy texture spots -->
    <circle cx="175" cy="200" r="12" fill="#A5D6A7" opacity="0.3" />
    <circle cx="220" cy="220" r="10" fill="#81C784" opacity="0.25" />
    <circle cx="200" cy="180" r="8" fill="#C8E6C9" opacity="0.2" />

    <!-- Floating leaves -->
    <g :class="{ 'small-leaf-float-1': animated }">
      <path d="M280,200 Q285,195 290,198 Q285,202 280,200Z" fill="#43A047" opacity="0.7" />
    </g>
    <g :class="{ 'small-leaf-float-2': animated }">
      <path d="M120,220 Q125,215 130,218 Q125,222 120,220Z" fill="#66BB6A" opacity="0.6" />
    </g>
    <g :class="{ 'small-leaf-float-3': animated }">
      <path d="M260,280 Q265,275 270,278 Q265,282 260,280Z" fill="#4CAF50" opacity="0.5" />
    </g>

    <!-- Soil mound at base -->
    <path
      d="M140,458 Q160,445 200,442 Q240,445 260,458 Q230,462 200,463 Q170,462 140,458Z"
      fill="url(#small-soil)" opacity="0.5"
    />
  </svg>
</template>

<script setup>
defineProps({
  animated: { type: Boolean, default: true }
})
</script>

<style scoped>
@keyframes small-leaf-float-1 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
  50% { transform: translate(15px, 30px) rotate(45deg); opacity: 0.4; }
  100% { transform: translate(30px, 80px) rotate(120deg); opacity: 0; }
}
@keyframes small-leaf-float-2 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
  50% { transform: translate(-10px, 25px) rotate(-30deg); opacity: 0.35; }
  100% { transform: translate(-25px, 70px) rotate(-90deg); opacity: 0; }
}
@keyframes small-leaf-float-3 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.5; }
  50% { transform: translate(8px, 20px) rotate(25deg); opacity: 0.3; }
  100% { transform: translate(20px, 60px) rotate(80deg); opacity: 0; }
}
.small-leaf-float-1 { animation: small-leaf-float-1 6s ease-in-out infinite; }
.small-leaf-float-2 { animation: small-leaf-float-2 7s ease-in-out infinite 1s; }
.small-leaf-float-3 { animation: small-leaf-float-3 8s ease-in-out infinite 2s; }
</style>
