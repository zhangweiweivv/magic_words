import api from './index'

const STATS_BASE = '/stats'

export const statsApi = {
  async getSummary() {
    const res = await api.get(`${STATS_BASE}/summary`)
    return res.data?.data || res.data
  },
  async getDailyStats() {
    const res = await api.get(`${STATS_BASE}/daily`)
    return res.data
  },
  async getCalendar() {
    const res = await api.get(`${STATS_BASE}/calendar`)
    return res.data
  },
  async getWeakWords() {
    const res = await api.get(`${STATS_BASE}/weak-words`)
    return res.data
  },
  async recordDaily(date, duration, wordsReviewed, accuracy) {
    const res = await api.post(`${STATS_BASE}/daily`, { date, duration, wordsReviewed, accuracy })
    return res.data
  },
  async recordWordError(word) {
    const res = await api.post(`${STATS_BASE}/word-error`, { word })
    return res.data
  }
}
