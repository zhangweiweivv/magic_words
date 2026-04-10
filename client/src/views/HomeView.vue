<template>
  <div class="home">
    <BubbleBackground :count="6" />
    <WaveDecoration position="bottom" />
    
    <div class="home-content">
      <div class="welcome-section">
        <div class="level-badge" v-if="pointsData">
          <span class="level-icon">{{ pointsData.levelName?.split(' ')[0] }}</span>
          <span class="level-name">{{ pointsData.levelName?.split(' ')[1] }}</span>
          <span class="points-count">💎 {{ pointsData.availablePoints }}</span>
        </div>
        <Dolphin ref="dolphinRef" :message="welcomeMessage" :mood="dolphinMood" :skin="equipped.dolphinSkin" />
        <h1 class="welcome-title">
          <span class="title-wave" v-for="(char, i) in '欢迎回来，可可！'" :key="i" :style="{ animationDelay: `${i * 0.1}s` }">{{ char }}</span>
        </h1>
      </div>

      <div class="stats-section">
        <div class="stat-card stat-pending" @click="$router.push('/words?filter=unlearned')">
          <div class="stat-icon">🐚</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.unlearned }}</div>
            <div class="stat-label">待探索</div>
          </div>
        </div>
        <div class="stat-card stat-mastered" @click="$router.push('/words?filter=learned')">
          <div class="stat-icon">💎</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.learned }}</div>
            <div class="stat-label">已收集</div>
          </div>
        </div>
        <div class="stat-card stat-rate">
          <div class="stat-icon">🧭</div>
          <div class="stat-info">
            <div class="stat-value">{{ masteryRate }}%</div>
            <div class="stat-label">探险进度</div>
          </div>
        </div>
      </div>

      <div class="review-card" @click="$router.push('/cards?mode=review')">
        <div class="review-decoration"><span class="decoration-star">⭐</span><span class="decoration-star">⭐</span></div>
        <div class="review-main">
          <div class="review-icon">🗺️</div>
          <div class="review-content">
            <h3>今日探险任务</h3>
            <div v-if="reviewCount > 0" class="review-count">
              <span class="count-number">{{ reviewCount }}</span>
              <span class="count-text">个宝藏待发现</span>
            </div>
            <div v-else class="review-done">今日任务完成！🎉</div>
          </div>
        </div>
        <div class="review-arrow"><span>→</span></div>
      </div>

      <div class="quick-actions">
        <OceanButton variant="primary" size="large" icon="🐬" @click="$router.push('/cards')">开始探险</OceanButton>
        <OceanButton variant="secondary" size="large" icon="📜" @click="$router.push('/words')">我的宝藏</OceanButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { wordsApi } from '../api/words'
import { getReviewStats } from '../api/review'
import { pointsApi } from '../api/points'
import Dolphin from '../components/Dolphin.vue'
import BubbleBackground from '../components/ocean/BubbleBackground.vue'
import WaveDecoration from '../components/ocean/WaveDecoration.vue'
import OceanButton from '../components/ocean/OceanButton.vue'
import { useShopConfig } from '../composables/useShopConfig'

const { equipped } = useShopConfig()

const stats = ref({ total: 0, unlearned: 0, learned: 0 })
const reviewCount = ref(0)
const dolphinMood = ref('happy')
const dolphinRef = ref(null)
const pointsData = ref(null)

const welcomeMessages = ['今天的海洋冒险开始啦！🌊', '多多陪你一起寻找宝藏！💎', '每个单词都是一颗珍珠！🦪', '准备好潜入知识的海洋了吗？🤿', '可可是最棒的小探险家！🏆', '让我们一起探索神秘海域！🐠', '今天想收集几个新单词呢？✨', '海底的宝藏在等着你哦！🗺️']
const welcomeMessage = ref('')

const masteryRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.learned / stats.value.total) * 100)
})

onMounted(async () => {
  welcomeMessage.value = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
  
  try {
    const res = await wordsApi.getStats()
    stats.value = res.data.data || res.data
    if (masteryRate.value >= 80) dolphinMood.value = 'excited'
    else if (masteryRate.value >= 50) dolphinMood.value = 'happy'
    else dolphinMood.value = 'thinking'
  } catch (e) { console.error('获取统计失败:', e) }

  try {
    const reviewRes = await getReviewStats()
    if (reviewRes.success) reviewCount.value = reviewRes.data.todayRemaining
  } catch (e) { console.error('获取复习统计失败:', e) }

  try {
    const pointsResult = await pointsApi.getPoints()
    if (pointsResult.success) {
      pointsData.value = pointsResult.data
    }
  } catch (e) { console.error('获取积分数据失败:', e) }
})
</script>

<style scoped>
.home { min-height: 100vh; background: var(--bg-gradient, var(--gradient-ocean)); position: relative; overflow: hidden; }
.home-content { position: relative; z-index: 2; padding: 20px; padding-bottom: 180px; }

.welcome-section { text-align: center; padding: 30px 20px 20px; }
.level-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  margin-bottom: 16px;
}
.level-icon { font-size: 24px; }
.level-name { color: white; font-weight: 500; }
.points-count { color: #F39C12; font-weight: bold; }
.welcome-title { color: var(--pearl); font-family: var(--font-display); font-size: 32px; margin-top: 20px; text-shadow: 2px 2px 4px rgba(30, 58, 95, 0.3); display: flex; justify-content: center; gap: 2px; }
.title-wave { display: inline-block; animation: title-float 2s ease-in-out infinite; }
@keyframes title-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

.stats-section { display: flex; justify-content: center; gap: 12px; margin: 30px auto; max-width: 500px; padding: 0 10px; }
.stat-card { flex: 1; background: var(--foam); border-radius: var(--radius-lg); padding: 16px 12px; text-align: center; box-shadow: var(--shadow-md); transition: all var(--transition-normal); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.stat-card:hover { transform: translateY(-5px) rotate(-2deg); box-shadow: var(--shadow-lg); }
.stat-pending { border-top: 4px solid var(--ocean-light); }
.stat-mastered { border-top: 4px solid var(--seaweed); }
.stat-rate { border-top: 4px solid var(--ocean-medium); }
.stat-icon { font-size: 36px; line-height: 1; }
.stat-info { display: flex; flex-direction: column; align-items: center; }
.stat-value { font-size: 28px; font-weight: bold; color: var(--ocean-deep); font-family: var(--font-display); }
.stat-label { font-size: 12px; color: var(--ocean-medium); margin-top: 2px; }

.review-card { background: linear-gradient(135deg, var(--ocean-medium) 0%, var(--seaweed) 100%); border-radius: var(--radius-lg); padding: 20px; margin: 20px auto; max-width: 500px; display: flex; align-items: center; cursor: pointer; transition: all var(--transition-normal); box-shadow: var(--shadow-seaweed); position: relative; overflow: hidden; }
.review-card:hover { transform: scale(1.02); box-shadow: var(--shadow-lg); }
.review-decoration { position: absolute; top: 10px; right: 10px; display: flex; gap: 5px; }
.decoration-star { font-size: 16px; animation: twinkle 1.5s ease-in-out infinite; }
.decoration-star:nth-child(2) { animation-delay: 0.5s; }
@keyframes twinkle { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }
.review-main { display: flex; align-items: center; flex: 1; }
.review-icon { font-size: 48px; margin-right: 16px; animation: float 3s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
.review-content h3 { color: white; font-size: 18px; font-family: var(--font-display); margin: 0 0 8px 0; }
.review-count { color: white; }
.count-number { font-size: 36px; font-weight: bold; font-family: var(--font-display); }
.count-text { font-size: 14px; margin-left: 4px; }
.review-done { color: white; font-size: 18px; }
.review-arrow { width: 40px; height: 40px; background: rgba(255, 255, 255, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; transition: transform var(--transition-normal); }
.review-card:hover .review-arrow { transform: translateX(5px); }

.quick-actions { display: flex; justify-content: center; gap: 16px; margin-top: 30px; flex-wrap: wrap; }

@media (max-width: 480px) {
  .welcome-title { font-size: 24px; }
  .stats-section { flex-direction: column; gap: 10px; }
  .stat-card { flex-direction: row; justify-content: flex-start; padding: 12px 16px; gap: 12px; }
  .stat-icon { font-size: 28px; }
  .stat-info { align-items: flex-start; }
  .stat-value { font-size: 24px; }
  .quick-actions { flex-direction: column; align-items: stretch; padding: 0 20px; }
}
</style>
