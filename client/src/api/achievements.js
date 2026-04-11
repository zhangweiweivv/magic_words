import api from './index'

const API_BASE = '/achievements'

export const achievementsApi = {
  async getAchievements() {
    const res = await api.get(API_BASE)
    return res.data?.data || res.data
  },
  async unlockAchievement(achievementId) {
    const res = await api.post(`${API_BASE}/unlock`, { achievementId })
    return res.data
  },
  async unlockBatch(ids) {
    const res = await api.post(`${API_BASE}/unlock-batch`, { ids })
    return res.data
  },
  async updateProgress(field, value) {
    const res = await api.post(`${API_BASE}/progress`, { field, value })
    return res.data
  }
}
