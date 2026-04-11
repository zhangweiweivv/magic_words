const BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export function fetchDueList() {
  return request('/state/due')
}

export function fetchArticleState(articleId) {
  return request(`/state/${encodeURIComponent(articleId)}`)
}

export function fetchCurrent() {
  return request('/state/current')
}

export function completeArticle(articleId) {
  return request(`/state/${encodeURIComponent(articleId)}/complete`, { method: 'POST' })
}

export function deferArticle(articleId) {
  return request(`/state/${encodeURIComponent(articleId)}/defer`, { method: 'POST' })
}

export function fetchCollections() {
  return request('/catalog/collections')
}

export function fetchCollection(name) {
  return request(`/catalog/${encodeURIComponent(name)}`)
}

export function updateArticleConfig(articleId, config) {
  return request(`/config/article/${encodeURIComponent(articleId)}`, {
    method: 'PUT',
    body: JSON.stringify(config)
  })
}

export function fetchRecommendation() {
  return request('/recommend/next')
}

export function fetchArticleContent(articleId) {
  return request(`/article/${encodeURIComponent(articleId)}/content`)
}
