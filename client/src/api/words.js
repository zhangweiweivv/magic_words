import api from './index'

export const wordsApi = {
  getAll() {
    return api.get('/words')
  },
  getUnlearned() {
    return api.get('/words/unlearned')
  },
  getLearned() {
    return api.get('/words/learned')
  },
  getStats() {
    return api.get('/words/stats')
  },
  moveToLearned(words) {
    return api.post('/words/move-to-learned', { words })
  }
}

export default wordsApi
