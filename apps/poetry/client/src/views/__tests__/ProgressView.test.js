import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ProgressView from '../ProgressView.vue'

// Mock the API module
vi.mock('../../api/index.js', () => ({
  fetchProgressOverview: vi.fn()
}))

import { fetchProgressOverview } from '../../api/index.js'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>home</div>' } },
      { path: '/progress', name: 'progress', component: ProgressView },
      { path: '/article/:articleId', name: 'article', component: { template: '<div>article</div>' } }
    ]
  })
}

const mockData = {
  overall: { total: 10, active: 3, graduated: 2, not_started: 5 },
  collections: [
    {
      name: '寅集',
      stats: { total: 7, active: 2, graduated: 1, not_started: 4 },
      articles: [
        { articleId: '寅集-01', title: '《论语》八章', section: '先秦诸子', status: 'active', currentStage: 2, totalStages: 5, intervals: [1,2,4,7,14], nextDueDate: '2026-04-12', scheduleSource: 'level_default', difficulty: 2 },
        { articleId: '寅集-02', title: '《老子》三章', section: '先秦诸子', status: 'graduated', currentStage: 5, totalStages: 5, intervals: [1,2,4,7,14], nextDueDate: null, scheduleSource: 'level_default', difficulty: 2 },
        { articleId: '寅集-03', title: '《孟子》三则', section: '先秦诸子', status: 'not_started', currentStage: null, totalStages: null, intervals: null, nextDueDate: null, scheduleSource: null, difficulty: null },
      ]
    },
    {
      name: '卯集',
      stats: { total: 3, active: 1, graduated: 1, not_started: 1 },
      articles: [
        { articleId: '卯集-01', title: '测试篇', section: '诗词', status: 'active', currentStage: 1, totalStages: 4, intervals: [1,2,4,7], nextDueDate: '2026-04-13', scheduleSource: 'level_default', difficulty: 2 },
      ]
    }
  ]
}

describe('ProgressView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders overall stats card', async () => {
    fetchProgressOverview.mockResolvedValue(mockData)

    const router = createTestRouter()
    await router.push('/progress')
    await router.isReady()

    const wrapper = mount(ProgressView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const overallStats = wrapper.find('[data-test="overall-stats"]')
    expect(overallStats.exists()).toBe(true)
    expect(overallStats.text()).toContain('10') // total
    expect(overallStats.text()).toContain('2')  // graduated
    expect(overallStats.text()).toContain('3')  // active
    expect(overallStats.text()).toContain('5')  // not_started
    expect(overallStats.text()).toContain('20%') // graduated pct
  })

  it('renders collection groups', async () => {
    fetchProgressOverview.mockResolvedValue(mockData)

    const router = createTestRouter()
    await router.push('/progress')
    await router.isReady()

    const wrapper = mount(ProgressView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const groups = wrapper.findAll('[data-test="collection-group"]')
    expect(groups.length).toBe(2)
    expect(groups[0].text()).toContain('寅集')
    expect(groups[1].text()).toContain('卯集')
  })

  it('shows article rows with status text', async () => {
    fetchProgressOverview.mockResolvedValue(mockData)

    const router = createTestRouter()
    await router.push('/progress')
    await router.isReady()

    const wrapper = mount(ProgressView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    // First collection is auto-expanded
    const rows = wrapper.findAll('[data-test="article-row"]')
    expect(rows.length).toBeGreaterThanOrEqual(3)

    // Check status rendering
    expect(rows[0].text()).toContain('第2轮')     // active
    expect(rows[1].text()).toContain('已掌握')    // graduated
    expect(rows[2].text()).toContain('未开始')    // not_started
  })

  it('shows loading state', async () => {
    fetchProgressOverview.mockReturnValue(new Promise(() => {})) // never resolves

    const router = createTestRouter()
    await router.push('/progress')
    await router.isReady()

    const wrapper = mount(ProgressView, {
      global: { plugins: [router] }
    })

    expect(wrapper.find('.loading').exists()).toBe(true)
  })

  it('shows error state', async () => {
    fetchProgressOverview.mockRejectedValue(new Error('Network error'))

    const router = createTestRouter()
    await router.push('/progress')
    await router.isReady()

    const wrapper = mount(ProgressView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.find('.error').exists()).toBe(true)
    expect(wrapper.text()).toContain('Network error')
  })

  it('navigates to article when clicking an active article row', async () => {
    fetchProgressOverview.mockResolvedValue(mockData)

    const router = createTestRouter()
    const pushSpy = vi.spyOn(router, 'push')
    await router.push('/progress')
    await router.isReady()

    const wrapper = mount(ProgressView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    // Click the first article (active)
    const rows = wrapper.findAll('[data-test="article-row"]')
    await rows[0].trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({
      name: 'article',
      params: { articleId: '寅集-01' }
    })
  })
})
