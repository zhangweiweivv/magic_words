<template>
  <div class="rainbow-bridge"><div class="rainbow"></div></div>
</template>
<script setup></script>
<style scoped>
.rainbow-bridge { position: fixed; inset: 0; pointer-events: none; overflow: hidden; }
.rainbow { position: absolute; top: 50%; left: -100%; width: 300%; height: 30px; background: linear-gradient(to bottom, #ff6b6b 0%, #ffd93d 20%, #6bcb77 40%, #4d96ff 60%, #a66cff 80%, #ff6eb4 100%); animation: cross 1.5s ease-in-out forwards; transform: translateY(-50%); border-radius: 15px; box-shadow: 0 0 30px rgba(255,107,107,0.5); }
@keyframes cross { 0% { left: -100%; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
</style>
