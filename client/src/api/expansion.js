import axios from 'axios'

const API_BASE = '/api/expansion'

export const expansionApi = {
  async getStatus() {
    const res = await axios.get(`${API_BASE}/status`)
    return res.data
  },

  async expand(force = false) {
    const res = await axios.post(`${API_BASE}/expand`, { force })
    return res.data
  }
}
