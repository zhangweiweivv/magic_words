import api from './index'

const SHOP_BASE = '/shop'

export const shopApi = {
  async getShopData() {
    const res = await api.get(SHOP_BASE)
    return res.data
  },
  async purchaseItem(category, itemId) {
    const res = await api.post(`${SHOP_BASE}/purchase`, { category, itemId })
    return res.data
  },
  async equipItem(category, itemId) {
    const res = await api.post(`${SHOP_BASE}/equip`, { category, itemId })
    return res.data
  },
  async verifyParent(password) {
    const res = await api.post(`${SHOP_BASE}/verify-parent`, { password })
    return res.data
  },
  async addRealReward(name, price, password) {
    const res = await api.post(`${SHOP_BASE}/rewards/add`, { name, price, password })
    return res.data
  },
  async redeemRealReward(rewardName, password) {
    const res = await api.post(`${SHOP_BASE}/rewards/redeem`, { rewardName, password })
    return res.data
  }
}
