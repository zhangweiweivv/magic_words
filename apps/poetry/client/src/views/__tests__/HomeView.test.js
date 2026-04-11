import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from '../HomeView.vue'

// Mock the API module
vi.mock('../../api/index.js', () => ({
  fetchDueList: vi.fn(),
  fetchRecommendation: vi.fn(),
  completeArticle: vi.fn()
}))

import { fetchDueList, fetchRecommendation, completeArticle } from '../../api/index.js'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/article/:articleId', name: 'article', component: { template: '<div>article</div>' } },
      { path: '/parent', name: 'parent', component: { template: '<div>parent</div>' } }
    ]
  })
}

describe('HomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders due items returned by the API', async () => {
    fetchDueList.mockResolvedValue({
      due: [
        { articleId: 'poem-1', title: '静夜思', currentStage: 2, collection: '子集' },
        { articleId: 'poem-2', title: '春晓', currentStage: 1, collection: '子集' }
      ],
      today: '2026-04-11'
    })
    fetchRecommendation.mockResolvedValue({ recommendation: null })

    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const items = wrapper.findAll('.due-item')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('静夜思')
    expect(items[0].text()).toContain('第2轮')
    expect(items[1].text()).toContain('春晓')
    expect(items[1].text()).toContain('第1轮')
  })

  it('shows empty message when no due items', async () => {
    fetchDueList.mockResolvedValue({ due: [], today: '2026-04-11' })
    fetchRecommendation.mockResolvedValue({ recommendation: null })

    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.find('.empty').exists()).toBe(true)
    expect(wrapper.find('.empty').text()).toContain('今天没有待复习')
  })

  it('navigates to article page when clicking a due item', async () => {
    fetchDueList.mockResolvedValue({
      due: [
        { articleId: 'poem-1', title: '静夜思', currentStage: 2, collection: '子集' }
      ],
      today: '2026-04-11'
    })
    fetchRecommendation.mockResolvedValue({ recommendation: null })

    const router = createTestRouter()
    const pushSpy = vi.spyOn(router, 'push')
    await router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    await wrapper.find('.due-item').trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({
      name: 'article',
      params: { articleId: 'poem-1' }
    })
  })

  it('renders recommendation card when API returns one', async () => {
    fetchDueList.mockResolvedValue({ due: [], today: '2026-04-11' })
    fetchRecommendation.mockResolvedValue({
      recommendation: {
        articleId: '寅集-01',
        title: '《论语》八章',
        topic: '先秦诸子',
        collection: '寅集'
      }
    })

    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const card = wrapper.find('.recommend-card')
    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('《论语》八章')
    expect(card.text()).toContain('先秦诸子')
    expect(wrapper.find('.start-btn').exists()).toBe(true)
    expect(wrapper.find('.start-btn').text()).toBe('开始学习')
  })

  it('calls completeArticle and navigates when clicking start button', async () => {
    fetchDueList.mockResolvedValue({ due: [], today: '2026-04-11' })
    fetchRecommendation.mockResolvedValue({
      recommendation: {
        articleId: '寅集-01',
        title: '《论语》八章',
        topic: '先秦诸子',
        collection: '寅集'
      }
    })
    completeArticle.mockResolvedValue({ state: {}, events: [] })

    const router = createTestRouter()
    const pushSpy = vi.spyOn(router, 'push')
    await router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    await wrapper.find('.start-btn').trigger('click')
    await flushPromises()

    expect(completeArticle).toHaveBeenCalledWith('寅集-01')
    expect(pushSpy).toHaveBeenCalledWith({
      name: 'article',
      params: { articleId: '寅集-01' }
    })
  })

  it('shows empty message when no recommendation', async () => {
    fetchDueList.mockResolvedValue({ due: [], today: '2026-04-11' })
    fetchRecommendation.mockResolvedValue({ recommendation: null })

    const router = createTestRouter()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.find('.recommend-card').exists()).toBe(false)
    expect(wrapper.find('.recommend-section').text()).toContain('当前没有新篇推荐')
  })
})
