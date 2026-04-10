<template>
  <div class="fireworks">
    <div v-for="burst in bursts" :key="burst.id" class="burst" :style="{ left: burst.x + '%', top: burst.y + '%' }">
      <div v-for="i in 16" :key="i" class="spark" :style="{ '--color': burst.color }"></div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
const bursts = ref([])
const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6eb4', '#a66cff']
onMounted(() => {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      bursts.value.push({ id: i, x: 20 + Math.random() * 60, y: 20 + Math.random() * 40, color: colors[Math.floor(Math.random() * colors.length)] })
    }, i * 300)
  }
})
</script>
<style scoped>
.fireworks { position: fixed; inset: 0; pointer-events: none; z-index: 9999; }
.burst { position: absolute; transform: translate(-50%, -50%); }
.spark { position: absolute; width: 8px; height: 8px; background: var(--color); border-radius: 50%; box-shadow: 0 0 6px var(--color); }
.spark:nth-child(1) { animation: sp1 1s ease-out forwards; } .spark:nth-child(2) { animation: sp2 1s ease-out forwards; }
.spark:nth-child(3) { animation: sp3 1s ease-out forwards; } .spark:nth-child(4) { animation: sp4 1s ease-out forwards; }
.spark:nth-child(5) { animation: sp5 1s ease-out forwards; } .spark:nth-child(6) { animation: sp6 1s ease-out forwards; }
.spark:nth-child(7) { animation: sp7 1s ease-out forwards; } .spark:nth-child(8) { animation: sp8 1s ease-out forwards; }
.spark:nth-child(9) { animation: sp9 1s ease-out forwards; } .spark:nth-child(10) { animation: sp10 1s ease-out forwards; }
.spark:nth-child(11) { animation: sp11 1s ease-out forwards; } .spark:nth-child(12) { animation: sp12 1s ease-out forwards; }
.spark:nth-child(13) { animation: sp13 1s ease-out forwards; } .spark:nth-child(14) { animation: sp14 1s ease-out forwards; }
.spark:nth-child(15) { animation: sp15 1s ease-out forwards; } .spark:nth-child(16) { animation: sp16 1s ease-out forwards; }
@keyframes sp1 { 0% { opacity:1; } 100% { transform: translate(60px,0); opacity:0; } }
@keyframes sp2 { 0% { opacity:1; } 100% { transform: translate(55px,23px); opacity:0; } }
@keyframes sp3 { 0% { opacity:1; } 100% { transform: translate(42px,42px); opacity:0; } }
@keyframes sp4 { 0% { opacity:1; } 100% { transform: translate(23px,55px); opacity:0; } }
@keyframes sp5 { 0% { opacity:1; } 100% { transform: translate(0,60px); opacity:0; } }
@keyframes sp6 { 0% { opacity:1; } 100% { transform: translate(-23px,55px); opacity:0; } }
@keyframes sp7 { 0% { opacity:1; } 100% { transform: translate(-42px,42px); opacity:0; } }
@keyframes sp8 { 0% { opacity:1; } 100% { transform: translate(-55px,23px); opacity:0; } }
@keyframes sp9 { 0% { opacity:1; } 100% { transform: translate(-60px,0); opacity:0; } }
@keyframes sp10 { 0% { opacity:1; } 100% { transform: translate(-55px,-23px); opacity:0; } }
@keyframes sp11 { 0% { opacity:1; } 100% { transform: translate(-42px,-42px); opacity:0; } }
@keyframes sp12 { 0% { opacity:1; } 100% { transform: translate(-23px,-55px); opacity:0; } }
@keyframes sp13 { 0% { opacity:1; } 100% { transform: translate(0,-60px); opacity:0; } }
@keyframes sp14 { 0% { opacity:1; } 100% { transform: translate(23px,-55px); opacity:0; } }
@keyframes sp15 { 0% { opacity:1; } 100% { transform: translate(42px,-42px); opacity:0; } }
@keyframes sp16 { 0% { opacity:1; } 100% { transform: translate(55px,-23px); opacity:0; } }
</style>
