<template>
  <div class="swimming-fish-container">
    <svg 
      v-for="fish in fishes" 
      :key="fish.id"
      class="fish"
      :class="fish.animClass"
      :style="fish.style"
      :viewBox="fish.viewBox"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g v-html="fish.svg"></g>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 真实风格的鱼 SVG 路径
const fishTypes = [
  // 热带鱼 - 橙色条纹
  {
    viewBox: '0 0 64 32',
    svg: `
      <ellipse cx="28" cy="16" rx="20" ry="10" fill="url(#grad1)"/>
      <path d="M48 16 L60 6 L60 26 Z" fill="#FF8C42"/>
      <circle cx="12" cy="14" r="3" fill="#333"/>
      <circle cx="13" cy="13" r="1" fill="white"/>
      <path d="M20 8 Q28 4 36 8" stroke="#FF5722" stroke-width="2" fill="none"/>
      <path d="M20 24 Q28 28 36 24" stroke="#FF5722" stroke-width="2" fill="none"/>
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#FFB74D"/>
          <stop offset="50%" style="stop-color:#FF8C42"/>
          <stop offset="100%" style="stop-color:#FF7043"/>
        </linearGradient>
      </defs>
    `,
    size: [64, 32]
  },
  // 蓝色小鱼
  {
    viewBox: '0 0 48 24',
    svg: `
      <ellipse cx="20" cy="12" rx="14" ry="8" fill="url(#grad2)"/>
      <path d="M34 12 L46 4 L46 20 Z" fill="#4FC3F7"/>
      <path d="M20 4 L24 0 L22 6 Z" fill="#29B6F6"/>
      <circle cx="10" cy="10" r="2.5" fill="#1A237E"/>
      <circle cx="11" cy="9" r="0.8" fill="white"/>
      <defs>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#81D4FA"/>
          <stop offset="100%" style="stop-color:#29B6F6"/>
        </linearGradient>
      </defs>
    `,
    size: [48, 24]
  },
  // 金鱼
  {
    viewBox: '0 0 56 32',
    svg: `
      <ellipse cx="24" cy="16" rx="16" ry="10" fill="url(#grad3)"/>
      <path d="M40 16 L54 8 L52 16 L54 24 Z" fill="#FFD54F"/>
      <path d="M24 6 L28 0 L26 8 Z" fill="#FFC107"/>
      <path d="M24 26 L28 32 L26 24 Z" fill="#FFC107"/>
      <circle cx="12" cy="14" r="3" fill="#333"/>
      <circle cx="13" cy="13" r="1" fill="white"/>
      <path d="M16 12 Q20 10 24 12" stroke="#FF8F00" stroke-width="1.5" fill="none" opacity="0.6"/>
      <defs>
        <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#FFE082"/>
          <stop offset="50%" style="stop-color:#FFD54F"/>
          <stop offset="100%" style="stop-color:#FFC107"/>
        </linearGradient>
      </defs>
    `,
    size: [56, 32]
  },
  // 紫色神仙鱼
  {
    viewBox: '0 0 40 48',
    svg: `
      <ellipse cx="20" cy="24" rx="12" ry="16" fill="url(#grad4)"/>
      <path d="M32 24 L40 18 L38 24 L40 30 Z" fill="#9575CD"/>
      <path d="M20 8 L24 0 L20 12 Z" fill="#7E57C2"/>
      <path d="M20 40 L24 48 L20 36 Z" fill="#7E57C2"/>
      <circle cx="14" cy="20" r="2.5" fill="#311B92"/>
      <circle cx="15" cy="19" r="0.8" fill="white"/>
      <path d="M14 26 Q20 28 26 26" stroke="#B39DDB" stroke-width="1" fill="none"/>
      <defs>
        <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#B39DDB"/>
          <stop offset="100%" style="stop-color:#7E57C2"/>
        </linearGradient>
      </defs>
    `,
    size: [40, 48]
  },
  // 绿色小鱼
  {
    viewBox: '0 0 44 22',
    svg: `
      <ellipse cx="18" cy="11" rx="12" ry="7" fill="url(#grad5)"/>
      <path d="M30 11 L42 5 L42 17 Z" fill="#66BB6A"/>
      <circle cx="10" cy="9" r="2" fill="#1B5E20"/>
      <circle cx="11" cy="8" r="0.6" fill="white"/>
      <defs>
        <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#A5D6A7"/>
          <stop offset="100%" style="stop-color:#66BB6A"/>
        </linearGradient>
      </defs>
    `,
    size: [44, 22]
  },
  // 红色锦鲤
  {
    viewBox: '0 0 72 36',
    svg: `
      <ellipse cx="30" cy="18" rx="22" ry="12" fill="url(#grad6)"/>
      <path d="M52 18 L70 8 L68 18 L70 28 Z" fill="#EF5350"/>
      <path d="M30 6 L36 0 L32 10 Z" fill="#E53935"/>
      <circle cx="14" cy="16" r="3.5" fill="#B71C1C"/>
      <circle cx="15" cy="15" r="1.2" fill="white"/>
      <ellipse cx="24" cy="18" rx="6" ry="8" fill="white" opacity="0.3"/>
      <ellipse cx="40" cy="18" rx="4" ry="6" fill="white" opacity="0.2"/>
      <defs>
        <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#EF9A9A"/>
          <stop offset="30%" style="stop-color:#EF5350"/>
          <stop offset="70%" style="stop-color:#E53935"/>
          <stop offset="100%" style="stop-color:#C62828"/>
        </linearGradient>
      </defs>
    `,
    size: [72, 36]
  }
]

// 大型海洋生物 SVG
const bigFishTypes = [
  // 海龟
  {
    viewBox: '0 0 80 60',
    svg: `
      <ellipse cx="40" cy="32" rx="28" ry="20" fill="url(#turtle1)"/>
      <ellipse cx="40" cy="32" rx="22" ry="14" fill="#5D4037"/>
      <path d="M38 18 L42 18 L44 22 L36 22 Z" fill="#8D6E63"/>
      <ellipse cx="16" cy="42" rx="10" ry="5" fill="#8D6E63" transform="rotate(-30 16 42)"/>
      <ellipse cx="64" cy="42" rx="10" ry="5" fill="#8D6E63" transform="rotate(30 64 42)"/>
      <ellipse cx="16" cy="24" rx="8" ry="4" fill="#8D6E63" transform="rotate(-20 16 24)"/>
      <ellipse cx="64" cy="24" rx="8" ry="4" fill="#8D6E63" transform="rotate(20 64 24)"/>
      <circle cx="12" cy="14" r="6" fill="#A1887F"/>
      <circle cx="10" cy="12" r="2" fill="#3E2723"/>
      <circle cx="11" cy="11" r="0.8" fill="white"/>
      <path d="M30 28 L34 36 L30 44 L36 40 L40 44 L44 40 L50 44 L46 36 L50 28 L44 32 L40 28 L36 32 Z" fill="#3E2723" opacity="0.3"/>
      <defs>
        <linearGradient id="turtle1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#A1887F"/>
          <stop offset="100%" style="stop-color:#6D4C41"/>
        </linearGradient>
      </defs>
    `,
    size: [80, 60]
  },
  // 鲨鱼
  {
    viewBox: '0 0 100 40',
    svg: `
      <path d="M10 20 Q30 8 60 12 L90 20 L60 28 Q30 32 10 20 Z" fill="url(#shark1)"/>
      <path d="M50 12 L55 0 L58 12 Z" fill="#546E7A"/>
      <path d="M90 20 L100 14 L100 26 Z" fill="#455A64"/>
      <path d="M60 28 L65 36 L55 30 Z" fill="#546E7A"/>
      <circle cx="20" cy="18" r="3" fill="#263238"/>
      <circle cx="21" cy="17" r="1" fill="white" opacity="0.5"/>
      <path d="M30 20 L35 20 L37 22 L35 24 L30 24 Z" fill="white"/>
      <defs>
        <linearGradient id="shark1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#78909C"/>
          <stop offset="50%" style="stop-color:#546E7A"/>
          <stop offset="100%" style="stop-color:#90A4AE"/>
        </linearGradient>
      </defs>
    `,
    size: [100, 40]
  },
  // 蝠鲼/魔鬼鱼
  {
    viewBox: '0 0 100 50',
    svg: `
      <ellipse cx="50" cy="28" rx="40" ry="18" fill="url(#manta1)"/>
      <path d="M10 28 Q0 20 5 10 Q12 18 15 28" fill="#37474F"/>
      <path d="M90 28 Q100 20 95 10 Q88 18 85 28" fill="#37474F"/>
      <path d="M50 46 L48 55 L52 55 Z" fill="#455A64"/>
      <circle cx="35" cy="24" r="3" fill="#263238"/>
      <circle cx="65" cy="24" r="3" fill="#263238"/>
      <ellipse cx="50" cy="34" rx="12" ry="4" fill="#90A4AE" opacity="0.5"/>
      <defs>
        <linearGradient id="manta1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#546E7A"/>
          <stop offset="100%" style="stop-color:#37474F"/>
        </linearGradient>
      </defs>
    `,
    size: [100, 50]
  },
  // 海豚
  {
    viewBox: '0 0 90 45',
    svg: `
      <path d="M8 25 Q20 12 50 15 Q75 18 85 25 Q75 32 50 35 Q20 38 8 25 Z" fill="url(#dolphin1)"/>
      <path d="M45 15 L50 5 L55 15 Z" fill="#5C6BC0"/>
      <path d="M85 25 L95 20 L95 30 Z" fill="#7986CB"/>
      <path d="M60 35 L65 42 L55 38 Z" fill="#5C6BC0"/>
      <circle cx="18" cy="23" r="3" fill="#1A237E"/>
      <circle cx="19" cy="22" r="1" fill="white"/>
      <path d="M25 25 Q30 27 35 25" stroke="#3F51B5" stroke-width="1.5" fill="none"/>
      <ellipse cx="40" cy="28" rx="15" ry="5" fill="#9FA8DA" opacity="0.4"/>
      <defs>
        <linearGradient id="dolphin1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#7986CB"/>
          <stop offset="50%" style="stop-color:#5C6BC0"/>
          <stop offset="100%" style="stop-color:#9FA8DA"/>
        </linearGradient>
      </defs>
    `,
    size: [90, 45]
  }
]

const fishes = ref([])
let fishId = 0
let spawnInterval = null

// 生成大型海洋生物（稀有）
const spawnBigFish = () => {
  const fishType = bigFishTypes[Math.floor(Math.random() * bigFishTypes.length)]
  const fromLeft = Math.random() > 0.5
  const top = 25 + Math.random() * 40
  const duration = 18 + Math.random() * 12
  const scale = 1.2 + Math.random() * 0.8 // 1.2-2.0倍
  
  const fish = {
    id: fishId++,
    viewBox: fishType.viewBox,
    svg: fishType.svg,
    animClass: 'anim-wobble',
    style: {
      top: `${top}%`,
      width: `${fishType.size[0] * scale}px`,
      height: `${fishType.size[1] * scale}px`,
      animationDuration: `${duration}s`,
      animationDelay: '0s',
      '--direction': fromLeft ? '1' : '-1',
      '--flip': fromLeft ? '-1' : '1',
      left: fromLeft ? '-150px' : 'auto',
      right: fromLeft ? 'auto' : '-150px',
      opacity: 0.9,
      filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
    }
  }
  
  fishes.value.push(fish)
  
  setTimeout(() => {
    fishes.value = fishes.value.filter(f => f.id !== fish.id)
  }, duration * 1000)
}

// 生成随机鱼
const spawnFish = () => {
  const fishType = fishTypes[Math.floor(Math.random() * fishTypes.length)]
  const fromLeft = Math.random() > 0.5
  const top = 15 + Math.random() * 70
  const duration = 10 + Math.random() * 12
  const scale = 0.8 + Math.random() * 0.8 // 0.8-1.6倍
  const wobble = Math.random() > 0.5
  
  const fish = {
    id: fishId++,
    viewBox: fishType.viewBox,
    svg: fishType.svg,
    animClass: wobble ? 'anim-wobble' : 'anim-straight',
    style: {
      top: `${top}%`,
      width: `${fishType.size[0] * scale}px`,
      height: `${fishType.size[1] * scale}px`,
      animationDuration: `${duration}s`,
      animationDelay: `${Math.random() * 2}s`,
      '--direction': fromLeft ? '1' : '-1',
      '--flip': fromLeft ? '-1' : '1',
      left: fromLeft ? '-80px' : 'auto',
      right: fromLeft ? 'auto' : '-80px',
      filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2))',
    }
  }
  
  fishes.value.push(fish)
  
  setTimeout(() => {
    fishes.value = fishes.value.filter(f => f.id !== fish.id)
  }, (duration + 2) * 1000)
}

// 生成鱼群
const spawnSchool = () => {
  const fishType = fishTypes[Math.floor(Math.random() * 3)] // 只用前3种小鱼
  const count = 4 + Math.floor(Math.random() * 5) // 4-8条鱼
  const baseTop = 20 + Math.random() * 50
  const fromLeft = Math.random() > 0.5
  const duration = 12 + Math.random() * 8
  const baseScale = 0.6 + Math.random() * 0.4
  
  for (let i = 0; i < count; i++) {
    const scale = baseScale + (Math.random() - 0.5) * 0.3
    const fish = {
      id: fishId++,
      viewBox: fishType.viewBox,
      svg: fishType.svg,
      animClass: 'anim-straight',
      style: {
        top: `${baseTop + (Math.random() - 0.5) * 15}%`,
        width: `${fishType.size[0] * scale}px`,
        height: `${fishType.size[1] * scale}px`,
        animationDuration: `${duration + Math.random() * 2}s`,
        animationDelay: `${i * 0.2 + Math.random() * 0.3}s`,
        '--direction': fromLeft ? '1' : '-1',
        '--flip': fromLeft ? '-1' : '1',
        left: fromLeft ? '-60px' : 'auto',
        right: fromLeft ? 'auto' : '-60px',
        opacity: 0.7 + Math.random() * 0.3,
        filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.15))',
      }
    }
    fishes.value.push(fish)
    
    setTimeout(() => {
      fishes.value = fishes.value.filter(f => f.id !== fish.id)
    }, (duration + 4) * 1000)
  }
}

onMounted(() => {
  // 初始生成
  setTimeout(spawnFish, 500)
  setTimeout(spawnSchool, 1500)
  setTimeout(spawnBigFish, 3000)
  
  // 定期生成新鱼
  spawnInterval = setInterval(() => {
    const rand = Math.random()
    if (rand < 0.1) {
      spawnBigFish()
    } else if (rand < 0.4) {
      spawnSchool()
    } else {
      spawnFish()
    }
  }, 3500)
})

onUnmounted(() => {
  if (spawnInterval) clearInterval(spawnInterval)
})
</script>

<style scoped>
.swimming-fish-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
  overflow: hidden;
}

.fish {
  position: absolute;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  will-change: transform;
}

.fish.anim-straight {
  animation-name: swimAcross;
}

.fish.anim-wobble {
  animation-name: swimAcrossWobble;
}

@keyframes swimAcross {
  0% {
    transform: translateX(0) scaleX(var(--flip, 1));
  }
  100% {
    transform: translateX(calc(var(--direction, 1) * (100vw + 150px))) scaleX(var(--flip, 1));
  }
}

@keyframes swimAcrossWobble {
  0% {
    transform: translateX(0) translateY(0) scaleX(var(--flip, 1));
  }
  20% {
    transform: translateX(calc(var(--direction, 1) * 20vw)) translateY(-12px) scaleX(var(--flip, 1));
  }
  40% {
    transform: translateX(calc(var(--direction, 1) * 40vw)) translateY(8px) scaleX(var(--flip, 1));
  }
  60% {
    transform: translateX(calc(var(--direction, 1) * 60vw)) translateY(-10px) scaleX(var(--flip, 1));
  }
  80% {
    transform: translateX(calc(var(--direction, 1) * 80vw)) translateY(6px) scaleX(var(--flip, 1));
  }
  100% {
    transform: translateX(calc(var(--direction, 1) * (100vw + 150px))) translateY(0) scaleX(var(--flip, 1));
  }
}
</style>
