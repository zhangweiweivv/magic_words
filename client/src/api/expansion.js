import api from './index'

const EXPANSION_BASE = '/expansion'

export const expansionApi = {
  async getStatus() {
    const res = await api.get(`${EXPANSION_BASE}/status`)
    return res.data
  },

  async expand(force = false) {
    const res = await api.post(`${EXPANSION_BASE}/expand`, { force })
    return res.data
  }
}
