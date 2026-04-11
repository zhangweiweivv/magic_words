import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ArticleDetailView from '../ArticleDetailView.vue'

vi.mock('../../api/index.js', () => ({
  fetchArticleState: vi.fn()
}))

import { fetchArticleState } from '../../api/index.js'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/article/:articleId/detail', name: 'article-detail', component: ArticleDetailView }
    ]
  })
}

describe('ArticleDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('poetry.effects.plumRain.enabled')
  })

  it('renders plum rain overlay by default', async () => {
    fetchArticleState.mockResolvedValue({
      state: {
        articleId: 'poem-1',
        title: '静夜思',
        collection: '子集',
        currentStage: 1,
        totalStages: 3,
        status: 'active',
        intervals: [1, 2, 5],
        nextDueDate: '2026-04-12'
      },
      events: []
    })

    const router = createTestRouter()
    await router.push('/article/poem-1/detail')
    await router.isReady()

    const wrapper = mount(ArticleDetailView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.find('[data-test="plum-rain-canvas"]').exists()).toBe(true)
  })
})
