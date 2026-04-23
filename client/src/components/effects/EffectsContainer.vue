<template>
  <Teleport to="body">
    <div class="effects-container">
      <component v-for="effect in activeEffects" :key="effect.id" :is="getEffectComponent(effect.name)" :x="effect.x" :y="effect.y" />
    </div>
  </Teleport>
</template>
<script setup>
import { defineAsyncComponent } from 'vue'
import { useEffects } from '../../composables/useEffects'
const effectComponents = {
  'confetti': defineAsyncComponent(() => import('./Confetti.vue')),
  'star-burst': defineAsyncComponent(() => import('./StarBurst.vue')),
  'fire-blast': defineAsyncComponent(() => import('./FireBlast.vue')),
  'fireworks': defineAsyncComponent(() => import('./Fireworks.vue')),
  'wave-ripple': defineAsyncComponent(() => import('./WaveRipple.vue')),
  'rainbow-ring': defineAsyncComponent(() => import('./RainbowRing.vue')),
  'rainbow-bridge': defineAsyncComponent(() => import('./RainbowBridge.vue')),
  'bubble-rise': defineAsyncComponent(() => import('./BubbleRise.vue')),
  'ocean-king': defineAsyncComponent(() => import('./OceanKing.vue'))
}
const { activeEffects } = useEffects()
const getEffectComponent = (name) => effectComponents[name] || null
</script>
<style scoped>
.effects-container { position: fixed; inset: 0; pointer-events: none; z-index: 9999; }
</style>
