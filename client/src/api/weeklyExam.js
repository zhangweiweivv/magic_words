import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000
})

export const weeklyExamApi = {
  getCurrent() {
    return api.get('/weekly-exam/current')
  },
  submitFirstRound(payload) {
    return api.post('/weekly-exam/first-round', payload)
  },
  complete(payload) {
    return api.post('/weekly-exam/complete', payload)
  }
}
