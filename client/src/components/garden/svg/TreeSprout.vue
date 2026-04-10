<template>
  <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sprout-stem" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#2E7D32" />
        <stop offset="50%" stop-color="#43A047" />
        <stop offset="100%" stop-color="#66BB6A" />
      </linearGradient>
      <radialGradient id="sprout-leaf" cx="40%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#A5D6A7" />
        <stop offset="50%" stop-color="#66BB6A" />
        <stop offset="100%" stop-color="#2E7D32" />
      </radialGradient>
      <radialGradient id="sprout-soil" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#D2B48C" />
        <stop offset="60%" stop-color="#A0826A" />
        <stop offset="100%" stop-color="#6B4226" />
      </radialGradient>
      <filter id="sprout-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#00000030" />
      </filter>
      <filter id="sprout-texture">
        <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" seed="5" />
        <feColorMatrix type="saturate" values="0" />
        <feBlend in="SourceGraphic" mode="multiply" />
      </filter>
    </defs>

    <!-- Ground shadow -->
    <ellipse cx="200" cy="440" rx="100" ry="15" fill="#00000012" />

    <!-- Soil mound -->
    <path
      d="M110,440 Q130,400 180,390 Q200,385 220,390 Q270,400 290,440 Q250,450 200,452 Q150,450 110,440Z"
      fill="url(#sprout-soil)"
      filter="url(#sprout-texture)"
    />
    <path
      d="M130,425 Q165,400 200,396 Q235,400 270,425 Q240,432 200,434 Q160,432 130,425Z"
      fill="#C4A882" opacity="0.3"
    />

    <!-- Main stem with curve -->
    <path
      d="M200,430 Q195,400 198,370 Q202,340 195,310 Q190,285 195,260"
      stroke="url(#sprout-stem)"
      stroke-width="5"
      fill="none"
      stroke-linecap="round"
      :class="{ 'sprout-sway': animated }"
    />

    <!-- Leaf 1 - bottom left -->
    <g :class="{ 'sprout-leaf-sway-l': animated }">
      <path
        d="M198,380 Q170,365 155,345 Q165,360 175,368 Q185,375 198,380Z"
        fill="url(#sprout-leaf)" stroke="#2E7D32" stroke-width="0.5"
      />
      <path d="M197,379 Q178,365 160,350" stroke="#43A047" stroke-width="0.6" fill="none" opacity="0.6" />
      <path d="M192,375 Q180,367 170,358" stroke="#43A047" stroke-width="0.4" fill="none" opacity="0.4" />
    </g>

    <!-- Leaf 2 - bottom right -->
    <g :class="{ 'sprout-leaf-sway-r': animated }" style="animation-delay: 0.3s">
      <path
        d="M200,370 Q225,350 245,340 Q230,358 218,365 Q210,370 200,370Z"
        fill="url(#sprout-leaf)" stroke="#2E7D32" stroke-width="0.5"
      />
      <path d="M202,369 Q222,354 240,343" stroke="#43A047" stroke-width="0.6" fill="none" opacity="0.6" />
      <path d="M207,366 Q220,358 232,350" stroke="#43A047" stroke-width="0.4" fill="none" opacity="0.4" />
    </g>

    <!-- Leaf 3 - mid left -->
    <g :class="{ 'sprout-leaf-sway-l': animated }" style="animation-delay: 0.6s">
      <path
        d="M196,335 Q165,318 148,298 Q162,312 175,322 Q186,330 196,335Z"
        fill="url(#sprout-leaf)" stroke="#2E7D32" stroke-width="0.5"
      />
      <path d="M195,334 Q172,318 153,302" stroke="#43A047" stroke-width="0.6" fill="none" opacity="0.5" />
    </g>

    <!-- Leaf 4 - mid right -->
    <g :class="{ 'sprout-leaf-sway-r': animated }" style="animation-delay: 0.9s">
      <path
        d="M197,320 Q220,302 240,290 Q225,308 215,315 Q206,320 197,320Z"
        fill="url(#sprout-leaf)" stroke="#2E7D32" stroke-width="0.5"
      />
      <path d="M199,319 Q218,305 235,294" stroke="#43A047" stroke-width="0.6" fill="none" opacity="0.5" />
    </g>

    <!-- Leaf 5 - upper left -->
    <g :class="{ 'sprout-leaf-sway-l': animated }" style="animation-delay: 1.2s">
      <path
        d="M194,290 Q172,275 160,258 Q170,272 180,280 Q188,286 194,290Z"
        fill="url(#sprout-leaf)" stroke="#2E7D32" stroke-width="0.5"
      />
      <path d="M193,289 Q178,277 165,263" stroke="#43A047" stroke-width="0.5" fill="none" opacity="0.5" />
    </g>

    <!-- Leaf 6 - top -->
    <g :class="{ 'sprout-leaf-sway-r': animated }" style="animation-delay: 0.2s">
      <path
        d="M195,265 Q200,245 210,235 Q205,250 200,258 Q198,262 195,265Z"
        fill="#A5D6A7" stroke="#43A047" stroke-width="0.5"
      />
      <path d="M196,264 Q202,250 208,239" stroke="#66BB6A" stroke-width="0.4" fill="none" opacity="0.5" />
    </g>

    <!-- Tiny top bud -->
    <path
      d="M195,260 Q192,248 195,240 Q198,248 195,260Z"
      fill="#C8E6C9"
      :class="{ 'sprout-sway': animated }"
    />

    <!-- Small stones near soil -->
    <ellipse cx="135" cy="438" rx="5" ry="3" fill="#A0A0A0" opacity="0.5" />
    <ellipse cx="260" cy="442" rx="6" ry="3.5" fill="#B0B0B0" opacity="0.5" />
  </svg>
</template>

<script setup>
defineProps({
  animated: { type: Boolean, default: true }
})
</script>

<style scoped>
@keyframes sprout-sway {
  0%, 100% { transform: rotate(0deg); transform-origin: 200px 430px; }
  33% { transform: rotate(2deg); transform-origin: 200px 430px; }
  66% { transform: rotate(-1.5deg); transform-origin: 200px 430px; }
}
@keyframes sprout-leaf-sway-l {
  0%, 100% { transform: rotate(0deg); transform-origin: 198px 380px; }
  50% { transform: rotate(-4deg); transform-origin: 198px 380px; }
}
@keyframes sprout-leaf-sway-r {
  0%, 100% { transform: rotate(0deg); transform-origin: 200px 370px; }
  50% { transform: rotate(4deg); transform-origin: 200px 370px; }
}
.sprout-sway { animation: sprout-sway 5s ease-in-out infinite; }
.sprout-leaf-sway-l { animation: sprout-leaf-sway-l 3.5s ease-in-out infinite; }
.sprout-leaf-sway-r { animation: sprout-leaf-sway-r 3.5s ease-in-out infinite; }
</style>
