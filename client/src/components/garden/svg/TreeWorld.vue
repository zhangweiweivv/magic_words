<template>
  <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="world-trunk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#4A2510" />
        <stop offset="20%" stop-color="#6B3A1F" />
        <stop offset="50%" stop-color="#8B4513" />
        <stop offset="80%" stop-color="#A0522D" />
        <stop offset="100%" stop-color="#5C2E0E" />
      </linearGradient>
      <radialGradient id="world-canopy" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#C8E6C9" />
        <stop offset="30%" stop-color="#66BB6A" />
        <stop offset="60%" stop-color="#2E7D32" />
        <stop offset="100%" stop-color="#1B5E20" />
      </radialGradient>
      <radialGradient id="world-golden" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#FFD700" stop-opacity="0.8" />
        <stop offset="40%" stop-color="#FFA500" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#FF8F00" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="world-aura" cx="50%" cy="45%" r="50%">
        <stop offset="0%" stop-color="#FFD700" stop-opacity="0.3" />
        <stop offset="50%" stop-color="#FFA500" stop-opacity="0.15" />
        <stop offset="100%" stop-color="#FFD700" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="world-rune-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFD700" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#FFA500" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="world-canopy-golden" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFD700" stop-opacity="0.4" />
        <stop offset="50%" stop-color="#66BB6A" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#FFD700" stop-opacity="0.3" />
      </linearGradient>
      <filter id="world-bark">
        <feTurbulence type="fractalNoise" baseFrequency="0.1 0.6" numOctaves="5" seed="13" />
        <feColorMatrix type="saturate" values="0.15" />
        <feBlend in="SourceGraphic" mode="multiply" />
      </filter>
      <filter id="world-glow">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feFlood flood-color="#FFD700" flood-opacity="0.5" />
        <feComposite in2="blur" operator="in" />
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="world-shadow">
        <feDropShadow dx="3" dy="5" stdDeviation="6" flood-color="#00000025" />
      </filter>
      <filter id="world-rune-filter">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feFlood flood-color="#FFD700" flood-opacity="0.8" />
        <feComposite in2="blur" operator="in" />
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <!-- Golden aura behind everything -->
    <ellipse cx="200" cy="200" rx="190" ry="180" fill="url(#world-aura)"
      :class="{ 'world-aura-pulse': animated }" />

    <!-- Ground shadow -->
    <ellipse cx="200" cy="490" rx="195" ry="15" fill="#00000015" />

    <!-- Extended roots reaching edges -->
    <path d="M160,465 Q100,472 40,488 Q60,478 90,472 Q130,466 160,465Z" fill="#6B3A1F" />
    <path d="M240,465 Q300,472 360,490 Q340,480 310,473 Q270,467 240,465Z" fill="#7A4420" />
    <path d="M175,468 Q120,478 60,495 Q80,486 110,480 Q145,474 175,468Z" fill="#5C2E0E" opacity="0.6" />
    <path d="M225,468 Q280,478 340,498 Q320,488 290,480 Q255,474 225,468Z" fill="#5C2E0E" opacity="0.6" />
    <path d="M190,470 Q150,480 100,495" stroke="#4A2510" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.4" />
    <path d="M210,470 Q250,480 300,498" stroke="#4A2510" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.4" />

    <!-- Massive trunk -->
    <path
      d="M155,470 Q140,420 138,360 Q135,300 142,260 Q148,230 155,210
         L245,210 Q252,230 258,260 Q265,300 262,360 Q260,420 245,470Z"
      fill="url(#world-trunk)" filter="url(#world-bark)" />
    <!-- Trunk highlight -->
    <path
      d="M188,465 Q180,400 182,330 Q184,280 190,220
         L210,220 Q204,280 202,330 Q200,400 205,465Z"
      fill="#CD853F" opacity="0.1" />

    <!-- Glowing runes on trunk -->
    <g filter="url(#world-rune-filter)" :class="{ 'world-rune-flicker': animated }">
      <path d="M185,420 L190,410 L195,420 L190,415Z" fill="#FFD700" opacity="0.8" />
      <path d="M195,380 Q200,370 205,380 Q200,375 195,380Z" fill="#FFD700" opacity="0.7" />
      <circle cx="190" cy="340" r="3" fill="#FFD700" opacity="0.6" />
      <path d="M200,310 L205,300 L210,310 L205,305Z" fill="#FFD700" opacity="0.7" />
      <path d="M188,290 Q192,282 196,290 L192,286Z" fill="#FFD700" opacity="0.6" />
      <circle cx="205" cy="260" r="2.5" fill="#FFD700" opacity="0.8" />
      <path d="M195,250 L198,242 L201,250Z" fill="#FFD700" opacity="0.5" />
    </g>

    <!-- Major branches -->
    <path d="M148,270 Q110,240 70,215" stroke="#8B4513" stroke-width="14" fill="none" stroke-linecap="round" />
    <path d="M252,265 Q290,235 330,210" stroke="#8B4513" stroke-width="13" fill="none" stroke-linecap="round" />
    <path d="M155,240 Q120,215 85,195" stroke="#8B4513" stroke-width="9" fill="none" stroke-linecap="round" />
    <path d="M245,235 Q280,212 315,192" stroke="#8B4513" stroke-width="9" fill="none" stroke-linecap="round" />
    <path d="M165,220 Q145,200 120,180" stroke="#8B4513" stroke-width="6" fill="none" stroke-linecap="round" />
    <path d="M235,218 Q255,198 278,178" stroke="#8B4513" stroke-width="6" fill="none" stroke-linecap="round" />

    <!-- Massive canopy -->
    <g filter="url(#world-shadow)">
      <ellipse cx="200" cy="130" rx="175" ry="130" fill="url(#world-canopy)" />
      <circle cx="350" cy="170" r="50" fill="#1B5E20" />
      <circle cx="55" cy="175" r="48" fill="#1B5E20" />
      <circle cx="200" cy="40" r="80" fill="#2E7D32" />
      <circle cx="300" cy="80" r="58" fill="#388E3C" />
      <circle cx="100" cy="85" r="55" fill="#2E7D32" />
      <circle cx="250" cy="50" r="48" fill="#43A047" />
      <circle cx="150" cy="48" r="45" fill="#388E3C" />
      <circle cx="200" cy="15" r="40" fill="#4CAF50" />
      <circle cx="330" cy="130" r="45" fill="#1B5E20" />
      <circle cx="70" cy="135" r="42" fill="#1B5E20" />
    </g>

    <!-- Golden canopy overlay -->
    <ellipse cx="200" cy="110" rx="150" ry="100" fill="url(#world-golden)" />
    <!-- Golden shimmer spots -->
    <circle cx="170" cy="80" r="18" fill="#FFD700" opacity="0.15" />
    <circle cx="230" cy="100" r="15" fill="#FFA500" opacity="0.12" />
    <circle cx="200" cy="50" r="20" fill="#FFD700" opacity="0.1" />
    <circle cx="140" cy="130" r="12" fill="#FFD700" opacity="0.1" />
    <circle cx="260" cy="70" r="14" fill="#FFA500" opacity="0.1" />

    <!-- Canopy highlights -->
    <circle cx="160" cy="90" r="35" fill="#C8E6C9" opacity="0.15" />
    <circle cx="240" cy="60" r="25" fill="#A5D6A7" opacity="0.12" />

    <!-- Golden halo ring -->
    <ellipse cx="200" cy="120" rx="170" ry="115" fill="none"
      stroke="#FFD700" stroke-width="2" opacity="0.3"
      stroke-dasharray="8 12"
      :class="{ 'world-halo-rotate': animated }" />
    <ellipse cx="200" cy="120" rx="180" ry="125" fill="none"
      stroke="#FFA500" stroke-width="1.5" opacity="0.2"
      stroke-dasharray="5 15"
      :class="{ 'world-halo-rotate-reverse': animated }" />

    <!-- Magic particles floating up from canopy -->
    <g :class="{ 'world-particle-1': animated }">
      <circle cx="160" cy="60" r="2.5" fill="#FFD700" opacity="0.8" />
    </g>
    <g :class="{ 'world-particle-2': animated }">
      <circle cx="230" cy="50" r="2" fill="#FFA500" opacity="0.7" />
    </g>
    <g :class="{ 'world-particle-3': animated }">
      <circle cx="200" cy="30" r="3" fill="#FFD700" opacity="0.6" />
    </g>
    <g :class="{ 'world-particle-4': animated }">
      <circle cx="140" cy="100" r="2" fill="#FFEB3B" opacity="0.7" />
    </g>
    <g :class="{ 'world-particle-5': animated }">
      <circle cx="260" cy="80" r="2.5" fill="#FFD700" opacity="0.6" />
    </g>
    <g :class="{ 'world-particle-6': animated }">
      <circle cx="180" cy="40" r="1.5" fill="#FFA500" opacity="0.8" />
    </g>
    <g :class="{ 'world-particle-7': animated }">
      <circle cx="250" cy="110" r="2" fill="#FFD700" opacity="0.5" />
    </g>
    <g :class="{ 'world-particle-8': animated }">
      <circle cx="120" cy="130" r="1.8" fill="#FFEB3B" opacity="0.6" />
    </g>
  </svg>
</template>

<script setup>
defineProps({
  animated: { type: Boolean, default: true }
})
</script>

<style scoped>
@keyframes world-aura-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
@keyframes world-rune-flicker {
  0%, 100% { opacity: 1; }
  30% { opacity: 0.6; }
  60% { opacity: 1; }
  80% { opacity: 0.4; }
}
@keyframes world-halo-rotate {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 200; }
}
@keyframes world-halo-rotate-reverse {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -200; }
}
@keyframes world-particle-rise-1 {
  0% { transform: translateY(0) scale(1); opacity: 0.8; }
  50% { transform: translateY(-40px) scale(0.8); opacity: 0.5; }
  100% { transform: translateY(-80px) scale(0.3); opacity: 0; }
}
@keyframes world-particle-rise-2 {
  0% { transform: translate(0, 0) scale(1); opacity: 0.7; }
  50% { transform: translate(10px, -35px) scale(0.7); opacity: 0.4; }
  100% { transform: translate(15px, -70px) scale(0.2); opacity: 0; }
}
@keyframes world-particle-rise-3 {
  0% { transform: translate(0, 0) scale(1); opacity: 0.6; }
  50% { transform: translate(-8px, -45px) scale(0.6); opacity: 0.35; }
  100% { transform: translate(-12px, -90px) scale(0.2); opacity: 0; }
}
@keyframes world-particle-rise-4 {
  0% { transform: translateY(0) scale(1); opacity: 0.7; }
  100% { transform: translateY(-65px) scale(0.3); opacity: 0; }
}
.world-aura-pulse { animation: world-aura-pulse 4s ease-in-out infinite; }
.world-rune-flicker { animation: world-rune-flicker 3s ease-in-out infinite; }
.world-halo-rotate { animation: world-halo-rotate 20s linear infinite; }
.world-halo-rotate-reverse { animation: world-halo-rotate-reverse 25s linear infinite; }
.world-particle-1 { animation: world-particle-rise-1 4s ease-out infinite; }
.world-particle-2 { animation: world-particle-rise-2 5s ease-out infinite 0.5s; }
.world-particle-3 { animation: world-particle-rise-3 4.5s ease-out infinite 1s; }
.world-particle-4 { animation: world-particle-rise-1 6s ease-out infinite 1.5s; }
.world-particle-5 { animation: world-particle-rise-2 5.5s ease-out infinite 2s; }
.world-particle-6 { animation: world-particle-rise-3 4s ease-out infinite 2.5s; }
.world-particle-7 { animation: world-particle-rise-4 5s ease-out infinite 3s; }
.world-particle-8 { animation: world-particle-rise-1 6s ease-out infinite 3.5s; }
</style>
