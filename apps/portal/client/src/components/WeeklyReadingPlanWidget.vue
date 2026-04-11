<template>
  <div v-if="visible" class="weekly-plan-widget">
    <div class="widget-header">
      <span class="header-title">🗓️ 晨读计划</span>
      <span class="header-time">07:15–07:35</span>
      <button class="expand-btn" @click="expanded = !expanded">
        {{ expanded ? '▲' : '▼' }}
      </button>
      <button class="close-btn" @click="visible = false">✕</button>
    </div>
    <div v-if="expanded" class="plan-grid">
      <div v-for="item in schedule" :key="item.day" class="plan-row">
        <span class="day-badge" :class="item.category">{{ item.day }}</span>
        <span class="activity">{{ item.icon }} {{ item.activity }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(true)
const expanded = ref(false)

const schedule = [
  { day: '周一', activity: '语文美文', icon: '📖', category: 'chinese' },
  { day: '周二', activity: 'RAZ 英语阅读', icon: '📚', category: 'english' },
  { day: '周三', activity: '语文古诗词', icon: '📜', category: 'chinese' },
  { day: '周四', activity: 'RAZ 英语阅读', icon: '📚', category: 'english' },
  { day: '周五', activity: '语文美文', icon: '📖', category: 'chinese' },
  { day: '周六', activity: 'RAZ 英语阅读', icon: '📚', category: 'english' },
  { day: '周日', activity: '语文古诗词', icon: '📜', category: 'chinese' }
]
</script>

<style scoped>
.weekly-plan-widget {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1000;
  min-width: 280px;
  max-width: 320px;
  background: rgba(30, 30, 60, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  color: #e0e0e0;
  font-family: inherit;
  overflow: hidden;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-title {
  font-weight: 700;
  font-size: 0.95rem;
}

.header-time {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-right: auto;
}

.expand-btn,
.close-btn {
  background: none;
  border: none;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 2px 6px;
  border-radius: 6px;
  transition: background 0.2s;
}

.expand-btn:hover,
.close-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.plan-grid {
  padding: 8px 14px 12px;
}

.plan-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.plan-row:last-child {
  border-bottom: none;
}

.day-badge {
  display: inline-block;
  min-width: 36px;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
}

.day-badge.chinese {
  background: linear-gradient(135deg, #c0392b, #e74c3c);
}

.day-badge.english {
  background: linear-gradient(135deg, #0077b6, #00b4d8);
}

.activity {
  font-size: 0.85rem;
}

.plan-row:hover {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
}

@media (max-width: 480px) {
  .weekly-plan-widget {
    left: 12px;
    right: 12px;
    max-width: none;
    min-width: auto;
  }
}
</style>
