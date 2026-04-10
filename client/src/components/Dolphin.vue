<template>
  <DuoDuo :mood="mood" :size="size" :message="message" :showCrown="showCrown" :skin="skin" />
</template>

<script setup>
import DuoDuo from './DuoDuo.vue'

defineProps({
  mood: { type: String, default: 'normal' },
  size: { type: Number, default: 120 },
  message: { type: String, default: '' },
  showCrown: { type: Boolean, default: false },
  skin: { type: String, default: 'default' }
})
</script>
