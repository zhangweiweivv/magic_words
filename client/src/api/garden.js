import api from './index'

const GARDEN_BASE = '/garden'

export async function getStatus() {
  const res = await api.get(`${GARDEN_BASE}/status`)
  return res.data
}

export async function water() {
  const res = await api.post(`${GARDEN_BASE}/water`)
  return res.data
}

export async function useSunshine() {
  const res = await api.post(`${GARDEN_BASE}/use-sunshine`)
  return res.data
}

export async function useFertilizer() {
  const res = await api.post(`${GARDEN_BASE}/use-fertilizer`)
  return res.data
}

export async function getFruits() {
  const res = await api.get(`${GARDEN_BASE}/fruits`)
  return res.data
}

export async function addResources(type, amount) {
  const res = await api.post(`${GARDEN_BASE}/add-resources`, { type, amount })
  return res.data
}
