import axios from 'axios'

const API_BASE = '/api/achievements'

export const achievementsApi = {
  async getAchievements() {
    const res = await axios.get(API_BASE)
    return res.data?.data || res.data
  },
  async unlockAchievement(achievementId) {
    const res = await axios.post(`${API_BASE}/unlock`, { achievementId })
    return res.data
  },
  async updateProgress(field, value) {
    const res = await axios.post(`${API_BASE}/progress`, { field, value })
    return res.data
  }
}
