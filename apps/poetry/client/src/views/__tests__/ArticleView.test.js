import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ArticleView from '../ArticleView.vue'

// Mock the API module
vi.mock('../../api/index.js', () => ({
  fetchArticleState: vi.fn(),
  fetchArticleContent: vi.fn(),
  completeArticle: vi.fn()
}))

import { fetchArticleState, fetchArticleContent, completeArticle } from '../../api/index.js'

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

  it('shows a Start button when browsing an article that has no state yet', async () => {
    fetchArticleContent.mockResolvedValue({
      articleId: '寅集-01',
      title: '《论语》八章',
      sections: {
        original: '原文行1',
        notes: '注释A',
        translation: '译文B',
        appreciation: '赏析C'
      }
    })
    fetchArticleState.mockRejectedValue(new Error('404'))

    const router = createTestRouter()
    await router.push('/article/寅集-01')
    await router.isReady()

    const wrapper = mount(ArticleView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const startBtn = wrapper.find('.start-learning-btn')
    expect(startBtn.exists()).toBe(true)
    expect(startBtn.text()).toContain('今日已学完')
    // Should render some content
    expect(wrapper.text()).toContain('原文行1')
  })

  it('renders the complete button when state exists', async () => {
    fetchArticleContent.mockResolvedValue({
      articleId: 'poem-1',
      title: '静夜思',
      sections: { original: '床前明月光', notes: '', translation: '', appreciation: '' }
    })
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

  it('calls API and updates UI when clicking Start button in browse mode', async () => {
    fetchArticleContent.mockResolvedValue({
      articleId: '寅集-01',
      title: '《论语》八章',
      sections: { original: '原文', notes: '', translation: '', appreciation: '' }
    })
    fetchArticleState.mockRejectedValue(new Error('404'))
    completeArticle.mockResolvedValue({
      state: {
        articleId: '寅集-01',
        title: '《论语》八章',
        collection: '寅集',
        currentStage: 1,
        totalStages: 4,
        status: 'active'
      },
      events: [{ type: 'article_started', timestamp: '2026-04-11T12:00:00Z' }]
    })

    const router = createTestRouter()
    await router.push('/article/寅集-01')
    await router.isReady()

    const wrapper = mount(ArticleView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const startBtn = wrapper.find('.start-learning-btn')
    await startBtn.trigger('click')
    await flushPromises()

    expect(completeArticle).toHaveBeenCalledWith('寅集-01')
  })
})
