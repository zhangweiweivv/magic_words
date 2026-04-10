<template>
  <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="house-trunk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#4A2510" />
        <stop offset="30%" stop-color="#8B4513" />
        <stop offset="60%" stop-color="#A0522D" />
        <stop offset="100%" stop-color="#5C2E0E" />
      </linearGradient>
      <radialGradient id="house-canopy" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#66BB6A" />
        <stop offset="50%" stop-color="#2E7D32" />
        <stop offset="100%" stop-color="#1B5E20" />
      </radialGradient>
      <radialGradient id="house-canopy-2" cx="40%" cy="35%" r="50%">
        <stop offset="0%" stop-color="#81C784" />
        <stop offset="100%" stop-color="#388E3C" />
      </radialGradient>
      <linearGradient id="house-wood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#A0522D" />
        <stop offset="50%" stop-color="#CD853F" />
        <stop offset="100%" stop-color="#A0522D" />
      </linearGradient>
      <linearGradient id="house-roof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#B71C1C" />
        <stop offset="50%" stop-color="#D32F2F" />
        <stop offset="100%" stop-color="#8B1A1A" />
      </linearGradient>
      <radialGradient id="house-window-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFF9C4" />
        <stop offset="40%" stop-color="#FFEE58" />
        <stop offset="100%" stop-color="#FFA000" />
      </radialGradient>
      <linearGradient id="house-ladder" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#8B6914" />
        <stop offset="100%" stop-color="#CD853F" />
      </linearGradient>
      <filter id="house-bark">
        <feTurbulence type="fractalNoise" baseFrequency="0.12 0.7" numOctaves="5" seed="11" />
        <feColorMatrix type="saturate" values="0.15" />
        <feBlend in="SourceGraphic" mode="multiply" />
      </filter>
      <filter id="house-shadow">
        <feDropShadow dx="3" dy="5" stdDeviation="5" flood-color="#00000030" />
      </filter>
      <filter id="house-glow-filter">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feFlood flood-color="#FFEE58" flood-opacity="0.4" />
        <feComposite in2="blur" operator="in" />
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <!-- Ground shadow -->
    <ellipse cx="205" cy="480" rx="160" ry="20" fill="#00000015" />

    <!-- Roots -->
    <path d="M170,460 Q130,468 90,478 Q100,470 120,464 Q145,459 170,460Z" fill="#7A4420" />
    <path d="M230,460 Q270,468 310,480 Q300,472 280,465 Q255,460 230,460Z" fill="#8B4513" />
    <path d="M185,462 Q160,472 140,482 Q150,474 165,467 Q178,463 185,462Z" fill="#6B3A1F" opacity="0.7" />

    <!-- Main thick trunk -->
    <path
      d="M168,465 Q158,420 155,370 Q152,320 158,280 Q162,260 168,240
         L232,240 Q238,260 242,280 Q248,320 245,370 Q242,420 232,465Z"
      fill="url(#house-trunk)" filter="url(#house-bark)" />
    <!-- Trunk highlight -->
    <path
      d="M190,460 Q184,400 186,340 Q188,290 192,245
         L205,245 Q202,290 200,340 Q198,400 200,460Z"
      fill="#CD853F" opacity="0.12" />

    <!-- Branches -->
    <path d="M162,290 Q135,265 105,248" stroke="#8B4513" stroke-width="10" fill="none" stroke-linecap="round" />
    <path d="M238,285 Q265,260 298,245" stroke="#8B4513" stroke-width="9" fill="none" stroke-linecap="round" />
    <path d="M170,260 Q150,240 128,225" stroke="#8B4513" stroke-width="6" fill="none" stroke-linecap="round" />
    <path d="M228,255 Q248,238 268,222" stroke="#8B4513" stroke-width="6" fill="none" stroke-linecap="round" />

    <!-- Canopy (very dense) -->
    <g filter="url(#house-shadow)">
      <ellipse cx="200" cy="160" rx="140" ry="120" fill="url(#house-canopy)" />
      <circle cx="310" cy="190" r="55" fill="#2E7D32" />
      <circle cx="95" cy="195" r="52" fill="#1B6B1B" />
      <circle cx="200" cy="85" r="70" fill="url(#house-canopy-2)" />
      <circle cx="270" cy="110" r="50" fill="#2E7D32" />
      <circle cx="130" cy="115" r="52" fill="#1B5E20" />
      <circle cx="215" cy="55" r="42" fill="#43A047" />
      <circle cx="160" cy="60" r="38" fill="#388E3C" />
      <circle cx="290" cy="155" r="40" fill="#1B5E20" />
      <circle cx="110" cy="160" r="38" fill="#1B5E20" />
    </g>

    <!-- Canopy highlights -->
    <circle cx="170" cy="130" r="30" fill="#A5D6A7" opacity="0.2" />
    <circle cx="220" cy="100" r="22" fill="#C8E6C9" opacity="0.15" />

    <!-- Tree house -->
    <g>
      <!-- House body -->
      <path
        d="M162,310 Q160,305 160,295 L160,355 Q160,360 165,360 L235,360 Q240,360 240,355 L240,295 Q240,305 238,310Z"
        fill="url(#house-wood)" />
      <!-- Wood plank lines -->
      <line x1="162" y1="315" x2="238" y2="315" stroke="#8B6914" stroke-width="0.8" opacity="0.4" />
      <line x1="162" y1="330" x2="238" y2="330" stroke="#8B6914" stroke-width="0.8" opacity="0.4" />
      <line x1="162" y1="345" x2="238" y2="345" stroke="#8B6914" stroke-width="0.8" opacity="0.4" />

      <!-- Roof -->
      <path
        d="M148,300 L200,260 L252,300 Q250,302 200,302 Q150,302 148,300Z"
        fill="url(#house-roof)" />
      <!-- Roof edge highlight -->
      <path d="M155,298 L200,264 L245,298" stroke="#E53935" stroke-width="1" fill="none" opacity="0.5" />

      <!-- Door -->
      <path d="M190,360 L190,335 Q190,330 195,330 L205,330 Q210,330 210,335 L210,360Z"
        fill="#6D4C41" stroke="#5D4037" stroke-width="1" />
      <!-- Door knob -->
      <circle cx="206" cy="348" r="2" fill="#FFD54F" />

      <!-- Left window with glow -->
      <g filter="url(#house-glow-filter)">
        <rect x="166" y="318" width="16" height="16" rx="2" fill="url(#house-window-glow)" />
      </g>
      <line x1="174" y1="318" x2="174" y2="334" stroke="#A0522D" stroke-width="1.2" />
      <line x1="166" y1="326" x2="182" y2="326" stroke="#A0522D" stroke-width="1.2" />

      <!-- Right window with glow -->
      <g filter="url(#house-glow-filter)">
        <rect x="218" y="318" width="16" height="16" rx="2" fill="url(#house-window-glow)" />
      </g>
      <line x1="226" y1="318" x2="226" y2="334" stroke="#A0522D" stroke-width="1.2" />
      <line x1="218" y1="326" x2="234" y2="326" stroke="#A0522D" stroke-width="1.2" />

      <!-- Flag on roof -->
      <line x1="200" y1="260" x2="200" y2="240" stroke="#5D4037" stroke-width="1.5" />
      <g :class="{ 'house-flag-wave': animated }">
        <path d="M200,240 Q210,243 208,248 Q205,253 200,250Z" fill="#E53935" />
        <path d="M200,240 Q210,243 208,248" stroke="#B71C1C" stroke-width="0.5" fill="none" />
      </g>
    </g>

    <!-- Ladder -->
    <g>
      <!-- Left rail -->
      <path d="M240,360 Q248,395 252,440 Q254,460 256,475"
        stroke="url(#house-ladder)" stroke-width="3" fill="none" stroke-linecap="round" />
      <!-- Right rail -->
      <path d="M250,358 Q258,393 262,438 Q264,458 266,473"
        stroke="url(#house-ladder)" stroke-width="3" fill="none" stroke-linecap="round" />
      <!-- Rungs -->
      <line x1="242" y1="375" x2="254" y2="373" stroke="#CD853F" stroke-width="2.5" stroke-linecap="round" />
      <line x1="244" y1="395" x2="256" y2="393" stroke="#CD853F" stroke-width="2.5" stroke-linecap="round" />
      <line x1="247" y1="415" x2="259" y2="413" stroke="#CD853F" stroke-width="2.5" stroke-linecap="round" />
      <line x1="249" y1="435" x2="261" y2="433" stroke="#CD853F" stroke-width="2.5" stroke-linecap="round" />
      <line x1="251" y1="455" x2="263" y2="453" stroke="#CD853F" stroke-width="2.5" stroke-linecap="round" />
    </g>

    <!-- Ground grass -->
    <g opacity="0.6">
      <path d="M90,476 Q93,462 96,452 Q95,464 98,476" fill="#43A047" />
      <path d="M300,478 Q303,466 306,458 Q305,468 308,478" fill="#66BB6A" />
      <path d="M200,474 Q202,464 205,456 Q204,466 207,474" fill="#4CAF50" />
    </g>
  </svg>
</template>

<script setup>
defineProps({
  animated: { type: Boolean, default: true }
})
</script>

<style scoped>
@keyframes house-flag-wave {
  0%, 100% { transform: skewX(0deg); transform-origin: 200px 240px; }
  25% { transform: skewX(5deg); transform-origin: 200px 240px; }
  75% { transform: skewX(-3deg); transform-origin: 200px 240px; }
}
.house-flag-wave { animation: house-flag-wave 2s ease-in-out infinite; }
</style>
