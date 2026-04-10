import axios from 'axios'

const API_BASE = '/api/stats'

export const statsApi = {
  async getSummary() {
    const res = await axios.get(`${API_BASE}/summary`)
    return res.data?.data || res.data
  },
  async getDailyStats() {
    const res = await axios.get(`${API_BASE}/daily`)
    return res.data
  },
  async getCalendar() {
    const res = await axios.get(`${API_BASE}/calendar`)
    return res.data
  },
  async getWeakWords() {
    const res = await axios.get(`${API_BASE}/weak-words`)
    return res.data
  },
  async recordDaily(date, duration, wordsReviewed, accuracy) {
    const res = await axios.post(`${API_BASE}/daily`, { date, duration, wordsReviewed, accuracy })
    return res.data
  },
  async recordWordError(word) {
    const res = await axios.post(`${API_BASE}/word-error`, { word })
    return res.data
  }
}
