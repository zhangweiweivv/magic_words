import axios from 'axios'

const API_BASE = '/api/points'

export const pointsApi = {
  async getPoints() {
    const res = await axios.get(API_BASE)
    return res.data
  },
  async getRules() {
    const res = await axios.get(`${API_BASE}/rules`)
    return res.data
  },
  async addPoints(action, points, note = '') {
    const res = await axios.post(`${API_BASE}/add`, { action, points, note })
    return res.data
  },
  async spendPoints(amount, item) {
    const res = await axios.post(`${API_BASE}/spend`, { amount, item })
    return res.data
  }
}
