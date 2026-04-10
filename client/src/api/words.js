import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000
})

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
