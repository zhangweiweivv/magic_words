import axios from 'axios'

const api = axios.create({
  baseURL: '/api/garden',
  timeout: 5000
})

export async function getStatus() {
  const res = await api.get('/status')
  return res.data
}

export async function water() {
  const res = await api.post('/water')
  return res.data
}

export async function useSunshine() {
  const res = await api.post('/use-sunshine')
  return res.data
}

export async function useFertilizer() {
  const res = await api.post('/use-fertilizer')
  return res.data
}

export async function getFruits() {
  const res = await api.get('/fruits')
  return res.data
}

export async function addResources(type, amount) {
  const res = await api.post('/add-resources', { type, amount })
  return res.data
}
