<template>
  <div class="shop">
    <BubbleBackground :count="8" />
    <WaveDecoration position="bottom" />
    
    <div class="shop-content">
      <!-- 顶部标题和积分 -->
      <div class="shop-header">
        <h1 class="shop-title">
          <span class="title-icon">🏪</span>
          <span>海洋商店</span>
        </h1>
        <div class="header-right">
          <button class="rules-btn" @click="showPointsRules = true">
            📜 积分规则
          </button>
          <div class="points-display">
            <span class="points-icon">⭐</span>
            <span class="points-value">{{ currentPoints }}</span>
          </div>
        </div>
      </div>

      <!-- 分类标签栏 -->
      <div class="category-tabs">
        <button 
          v-for="cat in categories" 
          :key="cat.key"
          :class="['category-tab', { active: activeCategory === cat.key }]"
          @click="activeCategory = cat.key"
        >
          <span class="tab-icon">{{ cat.icon }}</span>
          <span class="tab-label">{{ cat.label }}</span>
        </button>
      </div>

      <!-- 商品网格 -->
      <div class="items-grid" v-if="activeCategory !== 'rewards'">
        <div 
          v-for="item in currentItems" 
          :key="item.id"
          :class="['item-card', { owned: item.owned, equipped: item.equipped }]"
          @click="handleItemClick(item)"
        >
          <div class="item-preview">
            <span class="item-icon">{{ item.icon || '🎁' }}</span>
          </div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div v-if="item.equipped" class="item-status equipped">使用中</div>
            <div v-else-if="item.owned" class="item-status owned">已拥有</div>
            <div v-else class="item-price">
              <span class="price-icon">⭐</span>
              <span>{{ item.price }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="currentItems.length === 0" class="empty-state">
          <span class="empty-icon">🐚</span>
          <p>这个分类还没有商品哦~</p>
        </div>
      </div>

      <!-- 现实奖励区域 -->
      <div class="rewards-section" v-else>
        <div class="rewards-header">
          <h2>🎁 现实奖励</h2>
          <p class="rewards-hint">用积分兑换真实奖励，需要家长确认哦！</p>
        </div>
        
        <div class="rewards-grid">
          <div 
            v-for="reward in realRewards" 
            :key="reward.name"
            :class="['reward-card', { redeemed: reward.redeemed }]"
            @click="handleRewardClick(reward)"
          >
            <div class="reward-icon">{{ reward.icon || '🎁' }}</div>
            <div class="reward-name">{{ reward.name }}</div>
            <div v-if="reward.redeemed" class="reward-status">已兑换</div>
            <div v-else class="reward-price">
              <span class="price-icon">⭐</span>
              <span>{{ reward.price }}</span>
            </div>
          </div>
        </div>

        <div v-if="realRewards.length === 0" class="empty-state">
          <span class="empty-icon">🎀</span>
          <p>还没有设置现实奖励</p>
          <p class="hint">让爸爸妈妈来添加吧~</p>
        </div>
      </div>
    </div>

    <!-- 购买确认弹窗 -->
    <div v-if="showPurchaseModal" class="modal-overlay" @click.self="closePurchaseModal">
      <div class="modal-content purchase-modal">
        <div class="modal-header">
          <h3>确认购买</h3>
          <button class="close-btn" @click="closePurchaseModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="purchase-item">
            <span class="purchase-icon">{{ selectedItem?.icon || '🎁' }}</span>
            <span class="purchase-name">{{ selectedItem?.name }}</span>
          </div>
          <div class="purchase-cost">
            <span>需要消耗</span>
            <span class="cost-value">
              <span class="price-icon">⭐</span>
              {{ selectedItem?.price }}
            </span>
            <span>积分</span>
          </div>
          <div class="purchase-balance">
            <span>当前余额：</span>
            <span class="balance-value">{{ currentPoints }}</span>
            <span class="balance-after" v-if="currentPoints >= (selectedItem?.price || 0)">
              → {{ currentPoints - (selectedItem?.price || 0) }}
            </span>
          </div>
          <div v-if="currentPoints < (selectedItem?.price || 0)" class="insufficient">
            积分不足！还需要 {{ (selectedItem?.price || 0) - currentPoints }} 积分
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closePurchaseModal">取消</button>
          <button 
            class="btn-confirm" 
            :disabled="currentPoints < (selectedItem?.price || 0)"
            @click="confirmPurchase"
          >
            确认购买
          </button>
        </div>
      </div>
    </div>

    <!-- 装备确认弹窗 -->
    <div v-if="showEquipModal" class="modal-overlay" @click.self="closeEquipModal">
      <div class="modal-content equip-modal">
        <div class="modal-header">
          <h3>使用物品</h3>
          <button class="close-btn" @click="closeEquipModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="equip-item">
            <span class="equip-icon">{{ selectedItem?.icon || '🎁' }}</span>
            <span class="equip-name">{{ selectedItem?.name }}</span>
          </div>
          <p>要装备这个物品吗？</p>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeEquipModal">取消</button>
          <button class="btn-confirm" @click="confirmEquip">装备</button>
        </div>
      </div>
    </div>

    <!-- 家长验证弹窗 -->
    <div v-if="showParentModal" class="modal-overlay" @click.self="closeParentModal">
      <div class="modal-content parent-modal">
        <div class="modal-header">
          <h3>🔐 家长验证</h3>
          <button class="close-btn" @click="closeParentModal">✕</button>
        </div>
        <div class="modal-body">
          <p>兑换现实奖励需要家长确认</p>
          <div class="reward-preview">
            <span class="reward-icon">{{ selectedReward?.icon || '🎁' }}</span>
            <span class="reward-name">{{ selectedReward?.name }}</span>
            <span class="reward-cost">
              <span class="price-icon">⭐</span>
              {{ selectedReward?.price }}
            </span>
          </div>
          <div class="password-input">
            <label>请输入家长密码：</label>
            <input 
              v-model="parentPassword" 
              type="password" 
              placeholder="家长密码"
              @keyup.enter="confirmRewardRedeem"
            />
          </div>
          <div v-if="parentError" class="error-message">{{ parentError }}</div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeParentModal">取消</button>
          <button 
            class="btn-confirm" 
            :disabled="!parentPassword || isVerifying"
            @click="confirmRewardRedeem"
          >
            {{ isVerifying ? '验证中...' : '确认兑换' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div v-if="toast.show" :class="['toast', toast.type]">
      {{ toast.message }}
    </div>

    <!-- 积分规则弹窗 -->
    <div v-if="showPointsRules" class="modal-overlay" @click.self="showPointsRules = false">
      <div class="modal-content rules-modal">
        <div class="modal-header">
          <h3>📜 积分规则</h3>
          <button class="close-btn" @click="showPointsRules = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="rules-grid">
            <div class="rule-card">
              <div class="rule-emoji">🃏</div>
              <div class="rule-label">翻卡记住</div>
              <div class="rule-value">+1 ⭐</div>
            </div>
            <div class="rule-card">
              <div class="rule-emoji">✅</div>
              <div class="rule-label">选择题答对</div>
              <div class="rule-value">+2 ⭐</div>
            </div>
            <div class="rule-card">
              <div class="rule-emoji">✏️</div>
              <div class="rule-label">拼写题答对</div>
              <div class="rule-value">+3 ⭐</div>
            </div>
            <div class="rule-card">
              <div class="rule-emoji">🔥</div>
              <div class="rule-label">连续答对</div>
              <div class="rule-value">+1 ⭐/次</div>
            </div>
            <div class="rule-card special">
              <div class="rule-emoji">💯</div>
              <div class="rule-label">测试全对</div>
              <div class="rule-value">+10 ⭐</div>
            </div>
            <div class="rule-card special">
              <div class="rule-emoji">🏆</div>
              <div class="rule-label">掌握单词</div>
              <div class="rule-value">+5 ⭐/词</div>
            </div>
          </div>
          <div class="daily-bonus">
            <span class="daily-icon">🎁</span>
            <span class="daily-text">每日任务完成</span>
            <span class="daily-points">+20 ⭐</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BubbleBackground from '../components/ocean/BubbleBackground.vue'
import WaveDecoration from '../components/ocean/WaveDecoration.vue'
import { shopApi } from '../api/shop'
import { pointsApi } from '../api/points'
import { useShopConfig } from '../composables/useShopConfig'
import { useEffects } from '../composables/useEffects'
import { useAudio } from '../composables/useAudio'

const { updateEquipped } = useShopConfig()
const { equipEffect } = useEffects()
const { playBgmByShopId, equipShopSfx } = useAudio()

// 分类定义
const categories = [
  { key: 'skins', icon: '🐬', label: '皮肤' },
  { key: 'scenes', icon: '🏝️', label: '场景' },
  { key: 'effects', icon: '✨', label: '特效' },
  { key: 'music', icon: '🎵', label: '音乐' },
  { key: 'sounds', icon: '🔔', label: '音效' },
  { key: 'cardStyles', icon: '🃏', label: '卡片' },
  { key: 'rewards', icon: '🎁', label: '奖励' }
]

// 状态
const activeCategory = ref('skins')
const currentPoints = ref(0)
const showPointsRules = ref(false) // 点击按钮才显示
const shopData = ref({
  skins: [],
  scenes: [],
  effects: [],
  music: [],
  sounds: [],
  cardStyles: []
})
const realRewards = ref([])
const ownedItems = ref({})
const equippedItems = ref({})

// 弹窗状态
const showPurchaseModal = ref(false)
const showEquipModal = ref(false)
const showParentModal = ref(false)
const selectedItem = ref(null)
const selectedReward = ref(null)
const parentPassword = ref('')
const parentError = ref('')
const isVerifying = ref(false)

// Toast 状态
const toast = ref({ show: false, message: '', type: 'success' })

// 计算当前分类的商品
const currentItems = computed(() => {
  const items = shopData.value[activeCategory.value] || []
  return items.map(item => ({
    ...item,
    owned: ownedItems.value[activeCategory.value]?.includes(item.id),
    equipped: equippedItems.value[activeCategory.value] === item.id
  }))
})

// 显示 Toast
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 2500)
}

// 加载数据
const loadData = async () => {
  try {
    const [pointsRes, shopRes] = await Promise.all([
      pointsApi.getPoints(),
      shopApi.getShopData()
    ])
    
    currentPoints.value = pointsRes.data?.availablePoints || pointsRes.data?.points || pointsRes.availablePoints || pointsRes.points || 0
    
    if (shopRes.data) {
      const items = shopRes.data.items || {}
      const unlocked = shopRes.data.unlocked || {}
      const current = shopRes.data.current || {}
      
      // 映射后端数据到前端分类
      shopData.value = {
        skins: items.dolphinSkins || [],
        scenes: items.themes || [],
        effects: items.effects || [],
        music: items.music || [],
        sounds: items.sounds || [],
        cardStyles: items.cardSkins || []
      }
      
      // 映射已拥有的商品
      ownedItems.value = {
        skins: unlocked.dolphinSkins || [],
        scenes: unlocked.themes || [],
        effects: unlocked.effects || [],
        music: unlocked.music || [],
        sounds: unlocked.sounds || [],
        cardStyles: unlocked.cardSkins || []
      }
      
      // 映射当前装备的商品
      equippedItems.value = {
        skins: current.dolphinSkin || 'default',
        scenes: current.theme || 'default',
        effects: current.effect || 'default',
        music: current.music || 'none',
        sounds: current.sound || 'none',
        cardStyles: current.cardSkin || 'default'
      }
      
      realRewards.value = shopRes.data.realRewards || []
    }
  } catch (e) {
    console.error('加载商店数据失败:', e)
    showToast('加载失败，请刷新重试', 'error')
  }
}

// 处理商品点击
const handleItemClick = (item) => {
  selectedItem.value = item
  if (item.equipped) {
    // 已装备，不做任何事
    return
  } else if (item.owned) {
    // 已拥有但未装备，弹出装备确认
    showEquipModal.value = true
  } else {
    // 未拥有，弹出购买确认
    showPurchaseModal.value = true
  }
}

// 处理现实奖励点击
const handleRewardClick = (reward) => {
  if (reward.redeemed) {
    showToast('这个奖励已经兑换过啦~', 'info')
    return
  }
  if (currentPoints.value < reward.price) {
    showToast(`积分不足！还需要 ${reward.price - currentPoints.value} 积分`, 'error')
    return
  }
  selectedReward.value = reward
  parentPassword.value = ''
  parentError.value = ''
  showParentModal.value = true
}

// 关闭弹窗
const closePurchaseModal = () => {
  showPurchaseModal.value = false
  selectedItem.value = null
}

const closeEquipModal = () => {
  showEquipModal.value = false
  selectedItem.value = null
}

const closeParentModal = () => {
  showParentModal.value = false
  selectedReward.value = null
  parentPassword.value = ''
  parentError.value = ''
}

// 前端分类到后端分类的映射
const categoryMap = {
  skins: 'dolphinSkins',
  scenes: 'themes',
  effects: 'effects',
  music: 'music',
  sounds: 'sounds',
  cardStyles: 'cardSkins'
}

// 确认购买
const confirmPurchase = async () => {
  if (!selectedItem.value) return
  
  try {
    const backendCategory = categoryMap[activeCategory.value] || activeCategory.value
    const res = await shopApi.purchaseItem(backendCategory, selectedItem.value.id)
    if (res.success) {
      currentPoints.value = res.remainingPoints || res.data?.remainingPoints || currentPoints.value - selectedItem.value.price
      // 更新拥有状态
      if (!ownedItems.value[activeCategory.value]) {
        ownedItems.value[activeCategory.value] = []
      }
      ownedItems.value[activeCategory.value].push(selectedItem.value.id)
      showToast(`🎉 成功购买 ${selectedItem.value.name}！`)
      closePurchaseModal()
    } else {
      showToast(res.error || res.message || '购买失败', 'error')
    }
  } catch (e) {
    console.error('购买失败:', e)
    showToast('购买失败，请重试', 'error')
  }
}

// 确认装备
const confirmEquip = async () => {
  if (!selectedItem.value) return
  
  try {
    // 装备用的是 equipItem 的分类名
    const equipCategoryMap = {
      skins: 'dolphinSkin',
      scenes: 'theme',
      effects: 'effect',
      music: 'music',
      sounds: 'sound',
      cardStyles: 'cardSkin'
    }
    const backendCategory = equipCategoryMap[activeCategory.value] || activeCategory.value
    const res = await shopApi.equipItem(backendCategory, selectedItem.value.id)
    if (res.success) {
      equippedItems.value[activeCategory.value] = selectedItem.value.id
      // 更新全局配置
      updateEquipped(backendCategory, selectedItem.value.id)
      
      // 根据分类触发对应的效果
      if (backendCategory === 'effect') {
        equipEffect(selectedItem.value.id)
      } else if (backendCategory === 'music' && selectedItem.value.id !== 'none') {
        playBgmByShopId(selectedItem.value.id)
      } else if (backendCategory === 'sound') {
        equipShopSfx(selectedItem.value.id)
      }
      
      showToast(`已装备 ${selectedItem.value.name}！`)
      closeEquipModal()
    } else {
      showToast(res.error || res.message || '装备失败', 'error')
    }
  } catch (e) {
    console.error('装备失败:', e)
    showToast('装备失败，请重试', 'error')
  }
}

// 确认兑换现实奖励
const confirmRewardRedeem = async () => {
  if (!selectedReward.value || !parentPassword.value) return
  
  isVerifying.value = true
  parentError.value = ''
  
  try {
    const res = await shopApi.redeemRealReward(selectedReward.value.name, parentPassword.value)
    if (res.success) {
      currentPoints.value = res.data.points
      // 更新奖励状态
      const idx = realRewards.value.findIndex(r => r.name === selectedReward.value.name)
      if (idx !== -1) {
        realRewards.value[idx].redeemed = true
      }
      showToast(`🎉 兑换成功！记得找爸爸妈妈领取哦~`)
      closeParentModal()
    } else {
      parentError.value = res.message || '验证失败'
    }
  } catch (e) {
    console.error('兑换失败:', e)
    parentError.value = '验证失败，请重试'
  } finally {
    isVerifying.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.shop {
  min-height: 100vh;
  background: var(--bg-gradient, linear-gradient(180deg, #0a4d68 0%, #1a7f9c 50%, #2ab7ca 100%));
  padding-bottom: 80px;
  position: relative;
  overflow-x: hidden;
}

.shop-content {
  position: relative;
  z-index: 1;
  padding: 20px 16px;
  max-width: 600px;
  margin: 0 auto;
}

/* 顶部标题和积分 */
.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.shop-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 24px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.title-icon {
  font-size: 28px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rules-btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.rules-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.points-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: bold;
}

.points-icon {
  font-size: 18px;
}

.points-value {
  font-size: 20px;
  color: #ffd700;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.rule-card {
  background: white;
  border-radius: 14px;
  padding: 12px 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid #e8f4f8;
  transition: transform 0.2s, box-shadow 0.2s;
}

.rule-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.rule-card.special {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF3CD 100%);
  border-color: #FFD700;
}

.rule-emoji {
  font-size: 28px;
  margin-bottom: 6px;
}

.rule-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.rule-value {
  font-size: 18px;
  font-weight: 700;
  color: #2E86AB;
}

.rule-card.special .rule-value {
  color: #F59E0B;
}

.daily-bonus {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  background: linear-gradient(135deg, #48C9B0 0%, #1ABC9C 100%);
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(72, 201, 176, 0.4);
}

.daily-icon {
  font-size: 24px;
}

.daily-text {
  font-size: 15px;
  font-weight: 500;
  color: white;
}

.daily-points {
  font-size: 20px;
  font-weight: 700;
  color: #FFF9E6;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
}

/* 积分规则弹窗 */
.rules-modal .modal-body {
  padding: 16px;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.rule-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  border: 1px solid #e8f4f8;
}

.rule-card.special {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF3CD 100%);
  border-color: #FFD700;
}

.rule-emoji {
  font-size: 24px;
  margin-bottom: 4px;
}

.rule-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.rule-value {
  font-size: 16px;
  font-weight: 700;
  color: #2E86AB;
}

.rule-card.special .rule-value {
  color: #F59E0B;
}

.daily-bonus {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  background: linear-gradient(135deg, #48C9B0 0%, #1ABC9C 100%);
  border-radius: 12px;
}

.daily-icon {
  font-size: 22px;
}

.daily-text {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.daily-points {
  font-size: 18px;
  font-weight: 700;
  color: #FFF9E6;
}

/* 分类标签栏 */
.category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 16px;
  scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid transparent;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.category-tab:hover {
  background: rgba(255, 255, 255, 0.25);
}

.category-tab.active {
  background: white;
  color: #0a4d68;
  border-color: #ffd700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-size: 12px;
  font-weight: 500;
}

/* 商品网格 */
.items-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.item-card {
  background: white;
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.item-card.owned {
  border-color: #4CAF50;
}

.item-card.equipped {
  border-color: #ffd700;
  background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
}

.item-preview {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #e8f4f8 0%, #f0f9fc 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icon {
  font-size: 32px;
}

.item-info {
  text-align: center;
  width: 100%;
}

.item-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.item-status.owned {
  background: #e8f5e9;
  color: #4CAF50;
}

.item-status.equipped {
  background: #fff9e6;
  color: #f59e0b;
  font-weight: bold;
}

.item-price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 14px;
  font-weight: bold;
  color: #f59e0b;
}

.price-icon {
  font-size: 12px;
}

/* 现实奖励区域 */
.rewards-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
}

.rewards-header {
  text-align: center;
  margin-bottom: 20px;
}

.rewards-header h2 {
  color: white;
  margin: 0 0 8px 0;
  font-size: 20px;
}

.rewards-hint {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0;
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.reward-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reward-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.reward-card.redeemed {
  opacity: 0.6;
  cursor: not-allowed;
}

.reward-icon {
  font-size: 40px;
}

.reward-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  text-align: center;
}

.reward-status {
  font-size: 12px;
  color: #4CAF50;
  background: #e8f5e9;
  padding: 4px 12px;
  border-radius: 10px;
}

.reward-price {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  font-weight: bold;
  color: #f59e0b;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 20px;
  color: white;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  opacity: 0.8;
}

.empty-state .hint {
  font-size: 13px;
  margin-top: 8px;
  opacity: 0.6;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 360px;
  overflow: hidden;
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #eee;
}

.modal-body {
  padding: 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #eee;
}

.btn-confirm {
  background: linear-gradient(135deg, #2ab7ca 0%, #1a7f9c 100%);
  color: white;
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(42, 183, 202, 0.4);
}

.btn-confirm:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 购买弹窗内容 */
.purchase-item,
.equip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 16px;
}

.purchase-icon,
.equip-icon {
  font-size: 36px;
}

.purchase-name,
.equip-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.purchase-cost {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  color: #666;
  margin-bottom: 12px;
}

.cost-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 18px;
  font-weight: bold;
  color: #f59e0b;
}

.purchase-balance {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  color: #888;
}

.balance-value {
  color: #333;
  font-weight: 500;
}

.balance-after {
  color: #4CAF50;
}

.insufficient {
  text-align: center;
  color: #f44336;
  font-size: 14px;
  margin-top: 12px;
  padding: 8px;
  background: #ffebee;
  border-radius: 8px;
}

/* 家长验证弹窗 */
.reward-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  margin: 16px 0;
}

.password-input {
  margin-top: 16px;
}

.password-input label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.password-input input {
  width: 100%;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s ease;
}

.password-input input:focus {
  border-color: #2ab7ca;
}

.error-message {
  color: #f44336;
  font-size: 14px;
  margin-top: 12px;
  text-align: center;
}

/* Toast 提示 */
.toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1100;
  animation: toastIn 0.3s ease;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toast.success {
  background: #4CAF50;
  color: white;
}

.toast.error {
  background: #f44336;
  color: white;
}

.toast.info {
  background: #2196F3;
  color: white;
}
</style>
