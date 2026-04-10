import axios from 'axios'

const API_BASE = '/api/backup'

export const backupApi = {
  // 创建今日备份
  async create() {
    const res = await axios.post(`${API_BASE}/create`)
    return res.data
  },
  
  // 还原今日备份（撤销今日学习）
  async restore() {
    const res = await axios.post(`${API_BASE}/restore`)
    return res.data
  },
  
  // 检查是否有今日备份
  async status() {
    const res = await axios.get(`${API_BASE}/status`)
    return res.data
  }
}
