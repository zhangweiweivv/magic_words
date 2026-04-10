<template>
  <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="flower-trunk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#5C2E0E" />
        <stop offset="30%" stop-color="#8B4513" />
        <stop offset="65%" stop-color="#A0522D" />
        <stop offset="100%" stop-color="#6B3A1F" />
      </linearGradient>
      <radialGradient id="flower-canopy" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="#81C784" />
        <stop offset="50%" stop-color="#388E3C" />
        <stop offset="100%" stop-color="#1B5E20" />
      </radialGradient>
      <radialGradient id="flower-petal" cx="40%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#FFF0F5" />
        <stop offset="50%" stop-color="#FFB7C5" />
        <stop offset="100%" stop-color="#FF69B4" />
      </radialGradient>
      <radialGradient id="flower-center" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFE082" />
        <stop offset="100%" stop-color="#FFA000" />
      </radialGradient>
      <linearGradient id="flower-vine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#66BB6A" />
        <stop offset="100%" stop-color="#2E7D32" />
      </linearGradient>
      <filter id="flower-bark">
        <feTurbulence type="fractalNoise" baseFrequency="0.12 0.7" numOctaves="5" seed="9" />
        <feColorMatrix type="saturate" values="0.15" />
        <feBlend in="SourceGraphic" mode="multiply" />
      </filter>
      <filter id="flower-shadow">
        <feDropShadow dx="3" dy="5" stdDeviation="5" flood-color="#00000030" />
      </filter>
      <filter id="flower-glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feFlood flood-color="#FFB7C5" flood-opacity="0.3" />
        <feComposite in2="blur" operator="in" />
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <!-- Ground shadow -->
    <ellipse cx="205" cy="475" rx="150" ry="22" fill="#00000015" />

    <!-- Roots -->
    <path d="M175,455 Q140,462 110,472 Q120,464 140,459 Q160,456 175,455Z" fill="#7A4420" />
    <path d="M225,455 Q260,462 290,474 Q280,466 260,460 Q240,456 225,455Z" fill="#8B4513" />

    <!-- Vine on trunk -->
    <path d="M190,450 Q175,420 185,390 Q195,360 180,330 Q170,310 178,290"
      stroke="url(#flower-vine)" stroke-width="3" fill="none" stroke-linecap="round" />
    <path d="M185,430 Q175,425 170,420" stroke="#66BB6A" stroke-width="1.5" fill="none" />
    <path d="M182,400 Q172,395 168,392" stroke="#66BB6A" stroke-width="1.5" fill="none" />
    <path d="M180,370 Q170,365 165,362" stroke="#66BB6A" stroke-width="1.5" fill="none" />
    <!-- Vine tiny leaves -->
    <path d="M170,420 Q165,414 160,418 Q165,420 170,420Z" fill="#81C784" />
    <path d="M168,392 Q163,386 158,390 Q163,392 168,392Z" fill="#A5D6A7" />
    <path d="M165,362 Q160,356 155,360 Q160,362 165,362Z" fill="#81C784" />

    <!-- Main trunk -->
    <path
      d="M178,458 Q172,420 170,380 Q168,340 172,310 Q175,290 180,270
         L220,270 Q225,290 228,310 Q232,340 230,380 Q228,420 222,458Z"
      fill="url(#flower-trunk)" filter="url(#flower-bark)" />

    <!-- Branches -->
    <path d="M174,320 Q155,300 130,282 Q124,278 115,275" stroke="#8B4513" stroke-width="8" fill="none" stroke-linecap="round" />
    <path d="M226,310 Q248,292 272,278 Q280,272 288,268" stroke="#8B4513" stroke-width="7" fill="none" stroke-linecap="round" />
    <path d="M180,290 Q165,275 148,260" stroke="#8B4513" stroke-width="5" fill="none" stroke-linecap="round" />
    <path d="M218,285 Q235,270 250,258" stroke="#8B4513" stroke-width="5" fill="none" stroke-linecap="round" />

    <!-- Canopy -->
    <g filter="url(#flower-shadow)">
      <ellipse cx="200" cy="195" rx="120" ry="105" fill="url(#flower-canopy)" />
      <circle cx="285" cy="215" r="52" fill="#2E7D32" />
      <circle cx="118" cy="218" r="50" fill="#1B6B1B" />
      <circle cx="200" cy="125" r="62" fill="#388E3C" />
      <circle cx="255" cy="148" r="46" fill="#2E7D32" />
      <circle cx="148" cy="152" r="48" fill="#1B5E20" />
      <circle cx="210" cy="92" r="36" fill="#43A047" />
    </g>

    <!-- Flowers scattered across canopy -->
    <g filter="url(#flower-glow)">
      <!-- Flower 1 -->
      <g transform="translate(170, 140)">
        <circle cx="6" cy="0" r="5" fill="url(#flower-petal)" />
        <circle cx="-6" cy="0" r="5" fill="url(#flower-petal)" />
        <circle cx="0" cy="6" r="5" fill="url(#flower-petal)" />
        <circle cx="0" cy="-6" r="5" fill="url(#flower-petal)" />
        <circle cx="4" cy="4" r="4.5" fill="#FFF0F5" />
        <circle cx="0" cy="0" r="3" fill="url(#flower-center)" />
      </g>
      <!-- Flower 2 -->
      <g transform="translate(230, 160)">
        <circle cx="5" cy="0" r="4.5" fill="url(#flower-petal)" />
        <circle cx="-5" cy="0" r="4.5" fill="url(#flower-petal)" />
        <circle cx="0" cy="5" r="4.5" fill="url(#flower-petal)" />
        <circle cx="0" cy="-5" r="4.5" fill="url(#flower-petal)" />
        <circle cx="0" cy="0" r="2.5" fill="url(#flower-center)" />
      </g>
      <!-- Flower 3 -->
      <g transform="translate(200, 110)">
        <circle cx="5.5" cy="0" r="5" fill="#FFF0F5" />
        <circle cx="-5.5" cy="0" r="5" fill="#FFB7C5" />
        <circle cx="0" cy="5.5" r="5" fill="url(#flower-petal)" />
        <circle cx="0" cy="-5.5" r="5" fill="url(#flower-petal)" />
        <circle cx="0" cy="0" r="3" fill="url(#flower-center)" />
      </g>
      <!-- Flower 4 -->
      <g transform="translate(145, 200)">
        <circle cx="4" cy="0" r="4" fill="url(#flower-petal)" />
        <circle cx="-4" cy="0" r="4" fill="url(#flower-petal)" />
        <circle cx="0" cy="4" r="4" fill="#FFF0F5" />
        <circle cx="0" cy="-4" r="4" fill="url(#flower-petal)" />
        <circle cx="0" cy="0" r="2.5" fill="url(#flower-center)" />
      </g>
      <!-- Flower 5 -->
      <g transform="translate(260, 200)">
        <circle cx="5" cy="0" r="4.5" fill="url(#flower-petal)" />
        <circle cx="-5" cy="0" r="4.5" fill="#FFE4E8" />
        <circle cx="0" cy="5" r="4.5" fill="url(#flower-petal)" />
        <circle cx="0" cy="-5" r="4.5" fill="url(#flower-petal)" />
        <circle cx="0" cy="0" r="2.5" fill="url(#flower-center)" />
      </g>
      <!-- Flower 6 -->
      <g transform="translate(190, 180)">
        <circle cx="4.5" cy="0" r="4" fill="url(#flower-petal)" />
        <circle cx="-4.5" cy="0" r="4" fill="url(#flower-petal)" />
        <circle cx="0" cy="4.5" r="4" fill="#FFB7C5" />
        <circle cx="0" cy="-4.5" r="4" fill="url(#flower-petal)" />
        <circle cx="0" cy="0" r="2.5" fill="url(#flower-center)" />
      </g>
      <!-- Flower 7 small -->
      <g transform="translate(250, 130)">
        <circle cx="3.5" cy="0" r="3.5" fill="url(#flower-petal)" />
        <circle cx="-3.5" cy="0" r="3.5" fill="url(#flower-petal)" />
        <circle cx="0" cy="3.5" r="3.5" fill="url(#flower-petal)" />
        <circle cx="0" cy="-3.5" r="3.5" fill="#FFF0F5" />
        <circle cx="0" cy="0" r="2" fill="url(#flower-center)" />
      </g>
      <!-- Flower 8 small -->
      <g transform="translate(130, 170)">
        <circle cx="3" cy="0" r="3" fill="url(#flower-petal)" />
        <circle cx="-3" cy="0" r="3" fill="#FFB7C5" />
        <circle cx="0" cy="3" r="3" fill="url(#flower-petal)" />
        <circle cx="0" cy="-3" r="3" fill="url(#flower-petal)" />
        <circle cx="0" cy="0" r="2" fill="url(#flower-center)" />
      </g>
    </g>

    <!-- Falling petals -->
    <g :class="{ 'flower-petal-fall-1': animated }">
      <ellipse cx="150" cy="280" rx="4" ry="3" fill="#FFB7C5" opacity="0.7" transform="rotate(20 150 280)" />
    </g>
    <g :class="{ 'flower-petal-fall-2': animated }">
      <ellipse cx="250" cy="260" rx="3.5" ry="2.5" fill="#FFF0F5" opacity="0.6" transform="rotate(-15 250 260)" />
    </g>
    <g :class="{ 'flower-petal-fall-3': animated }">
      <ellipse cx="200" cy="290" rx="3" ry="2" fill="#FF69B4" opacity="0.5" transform="rotate(40 200 290)" />
    </g>

    <!-- Butterflies -->
    <g :class="{ 'flower-butterfly-1': animated }" transform="translate(280, 150)">
      <path d="M0,0 Q-8,-10 -5,-18 Q-2,-10 0,0Z" fill="#E1BEE7" opacity="0.8" />
      <path d="M0,0 Q8,-10 5,-18 Q2,-10 0,0Z" fill="#CE93D8" opacity="0.8" />
      <path d="M0,0 Q-5,6 -3,12 Q-1,6 0,0Z" fill="#E1BEE7" opacity="0.6" />
      <path d="M0,0 Q5,6 3,12 Q1,6 0,0Z" fill="#CE93D8" opacity="0.6" />
      <line x1="0" y1="0" x2="0" y2="2" stroke="#4A148C" stroke-width="1" />
    </g>
    <g :class="{ 'flower-butterfly-2': animated }" transform="translate(120, 130)">
      <path d="M0,0 Q-7,-9 -4,-16 Q-1,-9 0,0Z" fill="#FFCC80" opacity="0.8" />
      <path d="M0,0 Q7,-9 4,-16 Q1,-9 0,0Z" fill="#FFB74D" opacity="0.8" />
      <path d="M0,0 Q-4,5 -2,10 Q-1,5 0,0Z" fill="#FFCC80" opacity="0.6" />
      <path d="M0,0 Q4,5 2,10 Q1,5 0,0Z" fill="#FFB74D" opacity="0.6" />
      <line x1="0" y1="0" x2="0" y2="1.5" stroke="#E65100" stroke-width="0.8" />
    </g>
    <g :class="{ 'flower-butterfly-3': animated }" transform="translate(200, 70)">
      <path d="M0,0 Q-6,-8 -3,-14 Q-1,-8 0,0Z" fill="#B2EBF2" opacity="0.7" />
      <path d="M0,0 Q6,-8 3,-14 Q1,-8 0,0Z" fill="#80DEEA" opacity="0.7" />
      <path d="M0,0 Q-3,4 -2,8 Q-1,4 0,0Z" fill="#B2EBF2" opacity="0.5" />
      <path d="M0,0 Q3,4 2,8 Q1,4 0,0Z" fill="#80DEEA" opacity="0.5" />
      <line x1="0" y1="0" x2="0" y2="1.5" stroke="#006064" stroke-width="0.8" />
    </g>

    <!-- Ground grass -->
    <g opacity="0.6">
      <path d="M100,472 Q103,458 106,448 Q105,460 108,472" fill="#43A047" />
      <path d="M290,474 Q293,462 296,454 Q295,464 298,474" fill="#66BB6A" />
    </g>
  </svg>
</template>

<script setup>
defineProps({
  animated: { type: Boolean, default: true }
})
</script>

<style scoped>
@keyframes flower-petal-fall-1 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
  100% { transform: translate(20px, 150px) rotate(180deg); opacity: 0; }
}
@keyframes flower-petal-fall-2 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
  100% { transform: translate(-15px, 170px) rotate(-160deg); opacity: 0; }
}
@keyframes flower-petal-fall-3 {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.5; }
  100% { transform: translate(10px, 140px) rotate(200deg); opacity: 0; }
}
@keyframes flower-butterfly-1 {
  0% { transform: translate(280px, 150px) rotate(0deg); }
  25% { transform: translate(260px, 130px) rotate(5deg); }
  50% { transform: translate(290px, 115px) rotate(-3deg); }
  75% { transform: translate(270px, 140px) rotate(4deg); }
  100% { transform: translate(280px, 150px) rotate(0deg); }
}
@keyframes flower-butterfly-2 {
  0% { transform: translate(120px, 130px) rotate(0deg); }
  25% { transform: translate(140px, 110px) rotate(-5deg); }
  50% { transform: translate(115px, 100px) rotate(3deg); }
  75% { transform: translate(135px, 125px) rotate(-2deg); }
  100% { transform: translate(120px, 130px) rotate(0deg); }
}
@keyframes flower-butterfly-3 {
  0% { transform: translate(200px, 70px) rotate(0deg); }
  25% { transform: translate(215px, 55px) rotate(4deg); }
  50% { transform: translate(190px, 50px) rotate(-4deg); }
  75% { transform: translate(210px, 65px) rotate(2deg); }
  100% { transform: translate(200px, 70px) rotate(0deg); }
}
.flower-petal-fall-1 { animation: flower-petal-fall-1 5s ease-in infinite; }
.flower-petal-fall-2 { animation: flower-petal-fall-2 6s ease-in infinite 1.5s; }
.flower-petal-fall-3 { animation: flower-petal-fall-3 7s ease-in infinite 3s; }
.flower-butterfly-1 { animation: flower-butterfly-1 6s ease-in-out infinite; }
.flower-butterfly-2 { animation: flower-butterfly-2 5s ease-in-out infinite 1s; }
.flower-butterfly-3 { animation: flower-butterfly-3 7s ease-in-out infinite 2s; }
</style>
