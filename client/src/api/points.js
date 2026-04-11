import api from './index'

const POINTS_BASE = '/points'

export const pointsApi = {
  async getPoints() {
    const res = await api.get(POINTS_BASE)
    return res.data
  },
  async getRules() {
    const res = await api.get(`${POINTS_BASE}/rules`)
    return res.data
  },
  async addPoints(action, points, note = '') {
    const res = await api.post(`${POINTS_BASE}/add`, { action, points, note })
    return res.data
  },
  async spendPoints(amount, item) {
    const res = await api.post(`${POINTS_BASE}/spend`, { amount, item })
    return res.data
  }
}
