import axios from 'axios'

const API_BASE = '/api/shop'

export const shopApi = {
  async getShopData() {
    const res = await axios.get(API_BASE)
    return res.data
  },
  async purchaseItem(category, itemId) {
    const res = await axios.post(`${API_BASE}/purchase`, { category, itemId })
    return res.data
  },
  async equipItem(category, itemId) {
    const res = await axios.post(`${API_BASE}/equip`, { category, itemId })
    return res.data
  },
  async verifyParent(password) {
    const res = await axios.post(`${API_BASE}/verify-parent`, { password })
    return res.data
  },
  async addRealReward(name, price, password) {
    const res = await axios.post(`${API_BASE}/rewards/add`, { name, price, password })
    return res.data
  },
  async redeemRealReward(rewardName, password) {
    const res = await axios.post(`${API_BASE}/rewards/redeem`, { rewardName, password })
    return res.data
  }
}
