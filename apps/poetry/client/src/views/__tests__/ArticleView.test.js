import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ArticleView from '../ArticleView.vue'

// Mock the API module
vi.mock('../../api/index.js', () => ({
  fetchArticleState: vi.fn(),
  completeArticle: vi.fn()
}))

import { fetchArticleState, completeArticle } from '../../api/index.js'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>home</div>' } },
      { path: '/article/:articleId', name: 'article', component: ArticleView },
      { path: '/article/:articleId/detail', name: 'article-detail', component: { template: '<div>detail</div>' } }
    ]
  })
}

describe('ArticleView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the complete button', async () => {
    fetchArticleState.mockResolvedValue({
      state: {
        articleId: 'poem-1',
        title: '静夜思',
        collection: '子集',
        currentStage: 1,
        totalStages: 5,
        status: 'active'
      },
      events: []
    })

    const router = createTestRouter()
    await router.push('/article/poem-1')
    await router.isReady()

    const wrapper = mount(ArticleView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const btn = wrapper.find('.complete-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('今日已学完')
  })

  it('calls API and updates UI when clicking complete button', async () => {
    fetchArticleState.mockResolvedValue({
      state: {
        articleId: 'poem-1',
        title: '静夜思',
        collection: '子集',
        currentStage: 1,
        totalStages: 5,
        status: 'active'
      },
      events: []
    })

    completeArticle.mockResolvedValue({
      state: {
        articleId: 'poem-1',
        title: '静夜思',
        collection: '子集',
        currentStage: 2,
        totalStages: 5,
        status: 'active'
      },
      events: [{ type: 'stage_completed', timestamp: '2026-04-11T12:00:00Z' }]
    })

    const router = createTestRouter()
    await router.push('/article/poem-1')
    await router.isReady()

    const wrapper = mount(ArticleView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const btn = wrapper.find('.complete-btn')
    await btn.trigger('click')
    await flushPromises()

    expect(completeArticle).toHaveBeenCalledWith('poem-1')
    // Button text should change to show completion
    expect(btn.text()).toContain('已完成')
    // Button should be disabled
    expect(btn.attributes('disabled')).toBeDefined()
  })
})
