import api from './index'

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
