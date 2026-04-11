import api from './index'

const BACKUP_BASE = '/backup'

export const backupApi = {
  // 创建今日备份
  async create() {
    const res = await api.post(`${BACKUP_BASE}/create`)
    return res.data
  },
  
  // 还原今日备份（撤销今日学习）
  async restore() {
    const res = await api.post(`${BACKUP_BASE}/restore`)
    return res.data
  },
  
  // 检查是否有今日备份
  async status() {
    const res = await api.get(`${BACKUP_BASE}/status`)
    return res.data
  }
}
