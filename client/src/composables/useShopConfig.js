// client/src/composables/useShopConfig.js
import { ref, readonly } from 'vue'
import { shopApi } from '../api/shop'

const equipped = ref({
  dolphinSkin: 'default',
  theme: 'default',
  effect: 'default',
  music: 'none',
  sound: 'none',
  cardSkin: 'default'
})
const loaded = ref(false)

export function useShopConfig() {
  const loadConfig = async () => {
    try {
      const res = await shopApi.getShopData()
      if (res.data?.current) {
        equipped.value = { ...equipped.value, ...res.data.current }
      }
      loaded.value = true
    } catch (e) {
      console.warn('加载商店配置失败:', e)
      loaded.value = true
    }
  }

  const updateEquipped = (category, itemId) => {
    equipped.value = { ...equipped.value, [category]: itemId }
  }

  return { equipped: readonly(equipped), loaded: readonly(loaded), loadConfig, updateEquipped }
}
