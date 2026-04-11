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

  it('applies typography hooks for bookish headings (classes)', async () => {
    fetchArticleContent.mockResolvedValue({
      articleId: 'poem-font-1',
      title: '字体测试',
      sections: { original: '原文', notes: '注释', translation: '译文', appreciation: '赏析' }
    })
    fetchArticleState.mockRejectedValue(new Error('404'))

    const router = createTestRouter()
    await router.push('/article/poem-font-1')
    await router.isReady()

    const wrapper = mount(ArticleView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const title = wrapper.find('.article-header h1')
    expect(title.exists()).toBe(true)
    expect(title.classes()).toContain('article-title')

    const sectionTitles = wrapper.findAll('.content-block h3')
    expect(sectionTitles.length).toBeGreaterThan(0)
    for (const h3 of sectionTitles) {
      expect(h3.classes()).toContain('section-title')
    }
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
    expect(startBtn.text()).toContain('今日首学完成')
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
    expect(btn.text()).toContain('今日第1轮完成')
  })

  it('renders section chips only for non-empty sections', async () => {
    fetchArticleContent.mockResolvedValue({
      articleId: 'poem-2',
      title: '测试篇章',
      sections: {
        original: '原文有内容',
        notes: '',
        translation: '译文有内容',
        appreciation: '赏析有内容'
      }
    })
    fetchArticleState.mockRejectedValue(new Error('404'))

    const router = createTestRouter()
    await router.push('/article/poem-2')
    await router.isReady()

    const wrapper = mount(ArticleView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const chips = wrapper.find('.section-chips')
    expect(chips.exists()).toBe(true)
    expect(chips.text()).toContain('原文')
    expect(chips.text()).toContain('译文')
    expect(chips.text()).toContain('赏析')
    expect(chips.text()).not.toContain('注释')
  })

  it('scrolls to section when clicking a chip', async () => {
    fetchArticleContent.mockResolvedValue({
      articleId: 'poem-3',
      title: '测试跳转',
      sections: { original: '原文', notes: '注释', translation: '译文', appreciation: '赏析' }
    })
    fetchArticleState.mockRejectedValue(new Error('404'))

    // mock scrollIntoView
    const spy = vi.fn()
    Element.prototype.scrollIntoView = spy

    const router = createTestRouter()
    await router.push('/article/poem-3')
    await router.isReady()

    const wrapper = mount(ArticleView, {
      attachTo: document.body,
      global: { plugins: [router] }
    })

    await flushPromises()

    // click translation chip
    const translationChip = wrapper.find('[data-chip="translation"]')
    expect(translationChip.exists()).toBe(true)
    await translationChip.trigger('click')

    expect(spy).toHaveBeenCalled()
  })

  it('renders markdown-like chapter headings and removes *** separators', async () => {
    fetchArticleContent.mockResolvedValue({
      articleId: 'poem-4',
      title: '测试排版',
      sections: {
        original: '**一**\n子曰：学而时习之\n***\n**二**\n有朋自远方来',
        notes: '',
        translation: '',
        appreciation: ''
      }
    })
    fetchArticleState.mockRejectedValue(new Error('404'))

    const router = createTestRouter()
    await router.push('/article/poem-4')
    await router.isReady()

    const wrapper = mount(ArticleView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    // raw markdown markers should not leak
    expect(wrapper.text()).not.toContain('**一**')
    expect(wrapper.text()).not.toContain('***')

    // headings should render as dedicated elements
    const headings = wrapper.findAll('.content-heading')
    expect(headings.length).toBeGreaterThanOrEqual(2)
    expect(headings[0].text()).toContain('（一）')
    expect(headings[1].text()).toContain('（二）')

    const dividers = wrapper.findAll('.content-divider')
    expect(dividers.length).toBe(1)
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
