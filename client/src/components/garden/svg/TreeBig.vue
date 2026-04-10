<template>
  <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="big-trunk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#5C2E0E" />
        <stop offset="25%" stop-color="#8B4513" />
        <stop offset="60%" stop-color="#A0522D" />
        <stop offset="100%" stop-color="#6B3A1F" />
      </linearGradient>
      <radialGradient id="big-canopy-1" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#66BB6A" />
        <stop offset="60%" stop-color="#2E7D32" />
        <stop offset="100%" stop-color="#1B5E20" />
      </radialGradient>
      <radialGradient id="big-canopy-2" cx="40%" cy="35%" r="50%">
        <stop offset="0%" stop-color="#81C784" />
        <stop offset="100%" stop-color="#388E3C" />
      </radialGradient>
      <radialGradient id="big-canopy-light" cx="30%" cy="25%" r="45%">
        <stop offset="0%" stop-color="#C8E6C9" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#81C784" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="big-fruit" cx="35%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#FF6B6B" />
        <stop offset="100%" stop-color="#D32F2F" />
      </radialGradient>
      <filter id="big-bark">
        <feTurbulence type="fractalNoise" baseFrequency="0.12 0.7" numOctaves="5" seed="7" />
        <feColorMatrix type="saturate" values="0.15" />
        <feBlend in="SourceGraphic" mode="multiply" />
      </filter>
      <filter id="big-shadow">
        <feDropShadow dx="3" dy="5" stdDeviation="5" flood-color="#00000030" />
      </filter>
    </defs>

    <!-- Ground shadow -->
    <ellipse cx="205" cy="475" rx="150" ry="22" fill="#00000015" />

    <!-- Visible roots -->
    <path d="M175,455 Q140,462 110,470 Q115,465 130,460 Q150,456 175,455Z" fill="#7A4420" />
    <path d="M225,455 Q260,462 290,472 Q285,466 270,460 Q250,456 225,455Z" fill="#8B4513" />
    <path d="M190,458 Q170,468 150,478 Q160,470 175,464 Q185,460 190,458Z" fill="#6B3A1F" opacity="0.7" />
    <!-- Root texture -->
    <path d="M145,462 Q155,460 165,458" stroke="#5C2E0E" stroke-width="0.8" fill="none" opacity="0.4" />
    <path d="M255,463 Q265,461 275,465" stroke="#5C2E0E" stroke-width="0.8" fill="none" opacity="0.4" />

    <!-- Main trunk -->
    <path
      d="M178,458 Q172,420 170,380 Q168,340 172,310 Q175,290 180,270
         L220,270 Q225,290 228,310 Q232,340 230,380 Q228,420 222,458Z"
      fill="url(#big-trunk)"
      filter="url(#big-bark)"
    />
    <!-- Trunk highlight -->
    <path
      d="M192,455 Q188,400 190,350 Q192,310 195,275
         L202,275 Q200,310 198,350 Q196,400 198,455Z"
      fill="#CD853F" opacity="0.15"
    />

    <!-- Left branch -->
    <path
      d="M174,320 Q155,300 130,280 Q125,278 118,275"
      stroke="url(#big-trunk)" stroke-width="8" fill="none" stroke-linecap="round"
    />
    <!-- Right branch -->
    <path
      d="M226,310 Q248,290 270,275 Q278,270 285,268"
      stroke="url(#big-trunk)" stroke-width="7" fill="none" stroke-linecap="round"
    />
    <!-- Upper left branch -->
    <path
      d="M180,290 Q165,275 150,260"
      stroke="#8B4513" stroke-width="5" fill="none" stroke-linecap="round"
    />
    <!-- Upper right branch -->
    <path
      d="M218,285 Q235,270 248,258"
      stroke="#8B4513" stroke-width="5" fill="none" stroke-linecap="round"
    />

    <!-- Canopy layers (multiple irregular circles) -->
    <g filter="url(#big-shadow)">
      <!-- Base canopy -->
      <ellipse cx="200" cy="195" rx="120" ry="105" fill="url(#big-canopy-1)" />
      <!-- Right cluster -->
      <circle cx="285" cy="215" r="55" fill="#2E7D32" />
      <!-- Left cluster -->
      <circle cx="120" cy="220" r="52" fill="#1B6B1B" />
      <!-- Top cluster -->
      <circle cx="200" cy="125" r="65" fill="url(#big-canopy-2)" />
      <!-- Top-right -->
      <circle cx="255" cy="145" r="48" fill="#388E3C" />
      <!-- Top-left -->
      <circle cx="148" cy="150" r="50" fill="#2E7D32" />
      <!-- Very top -->
      <circle cx="210" cy="90" r="38" fill="#43A047" />
      <!-- Bottom right bump -->
      <circle cx="270" cy="260" r="35" fill="#1B5E20" />
      <!-- Bottom left bump -->
      <circle cx="130" cy="265" r="33" fill="#1B5E20" />
    </g>

    <!-- Canopy highlights -->
    <ellipse cx="175" cy="165" rx="55" ry="50" fill="url(#big-canopy-light)" />
    <circle cx="230" cy="140" r="25" fill="#A5D6A7" opacity="0.2" />
    <circle cx="160" cy="130" r="20" fill="#C8E6C9" opacity="0.15" />

    <!-- Fruits -->
    <circle cx="160" cy="230" r="7" fill="url(#big-fruit)" />
    <circle cx="163" cy="228" r="2" fill="white" opacity="0.4" />
    <circle cx="240" cy="210" r="6" fill="url(#big-fruit)" />
    <circle cx="242" cy="208" r="1.5" fill="white" opacity="0.4" />
    <circle cx="200" cy="250" r="7" fill="url(#big-fruit)" />
    <circle cx="203" cy="248" r="2" fill="white" opacity="0.4" />
    <circle cx="270" cy="240" r="5.5" fill="url(#big-fruit)" />
    <circle cx="272" cy="238" r="1.5" fill="white" opacity="0.4" />

    <!-- Bird on right branch -->
    <g transform="translate(275, 258)" :class="{ 'big-bird-bob': animated }">
      <!-- Bird body -->
      <ellipse cx="0" cy="0" rx="10" ry="7" fill="#FF8F00" />
      <!-- Bird head -->
      <circle cx="10" cy="-4" r="6" fill="#FFB300" />
      <!-- Bird eye -->
      <circle cx="12" cy="-5" r="1.5" fill="#333" />
      <circle cx="12.5" cy="-5.5" r="0.5" fill="white" />
      <!-- Bird beak -->
      <path d="M16,-4 L20,-3 L16,-2Z" fill="#E65100" />
      <!-- Bird wing -->
      <path d="M-2,-3 Q-5,-10 2,-6 Q8,-10 5,-3Z" fill="#F57C00" />
      <!-- Bird tail -->
      <path d="M-10,0 Q-16,-5 -14,2 Q-16,5 -10,2Z" fill="#EF6C00" />
      <!-- Bird legs -->
      <line x1="-2" y1="7" x2="-3" y2="12" stroke="#5D4037" stroke-width="1" />
      <line x1="3" y1="7" x2="4" y2="12" stroke="#5D4037" stroke-width="1" />
    </g>

    <!-- Ground grass -->
    <g opacity="0.6">
      <path d="M100,472 Q103,458 106,448 Q105,460 108,472" fill="#43A047" />
      <path d="M290,474 Q293,462 296,454 Q295,464 298,474" fill="#66BB6A" />
      <path d="M200,470 Q202,460 205,452 Q204,462 207,470" fill="#4CAF50" />
    </g>
  </svg>
</template>

<script setup>
defineProps({
  animated: { type: Boolean, default: true }
})
</script>

<style scoped>
@keyframes big-bird-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  30% { transform: translateY(-2px) rotate(-3deg); }
  60% { transform: translateY(0) rotate(2deg); }
}
.big-bird-bob { animation: big-bird-bob 2s ease-in-out infinite; }
</style>
