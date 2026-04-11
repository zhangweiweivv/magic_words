import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ParentView from '../ParentView.vue'

vi.mock('../../api/index.js', () => ({
  fetchArticleState: vi.fn(),
  updateArticleConfig: vi.fn(),
  fetchDifficultyRules: vi.fn(),
  fetchAdminCollections: vi.fn(),
  fetchCollectionArticles: vi.fn(),
  updateDifficultyLevel: vi.fn(),
  overrideArticleSchedule: vi.fn(),
  resetArticleToDefault: vi.fn()
}))

import {
  fetchArticleState,
  updateArticleConfig,
  fetchDifficultyRules,
  fetchAdminCollections,
  fetchCollectionArticles,
  updateDifficultyLevel,
  overrideArticleSchedule,
  resetArticleToDefault
} from '../../api/index.js'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>home</div>' } },
      { path: '/parent', name: 'parent', component: ParentView }
    ]
  })
}

describe('ParentView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('poetry.effects.plumRain.enabled')

    // Default mocks for new admin calls (keep component mount simple)
    fetchDifficultyRules.mockResolvedValue({
      defaults: {
        1: { totalStages: 3, intervals: [1, 2, 5] },
        2: { totalStages: 3, intervals: [1, 3, 7] },
        3: { totalStages: 4, intervals: [1, 3, 7, 14] },
        4: { totalStages: 5, intervals: [2, 4, 7, 14, 21] }
      }
    })
    fetchAdminCollections.mockResolvedValue({ collections: ['寅集'] })
    fetchCollectionArticles.mockResolvedValue({
      collection: '寅集',
      articles: [
        {
          number: 1,
          title: '《论语》八章',
          section: '先秦诸子',
          articleId: '寅集-01',
          difficulty: 2,
          scheduleSource: 'override',
          status: 'active',
          stage: 0,
          totalStages: 3,
          intervals: [1, 3, 7]
        }
      ]
    })
    updateDifficultyLevel.mockResolvedValue({ defaults: { totalStages: 3, intervals: [1, 3, 7] } })
    overrideArticleSchedule.mockResolvedValue({ state: { articleId: '寅集-01' } })
    resetArticleToDefault.mockResolvedValue({ state: { articleId: '寅集-01' } })
  })

  it('toggles plum rain effect setting and persists to localStorage', async () => {
    fetchArticleState.mockRejectedValue(new Error('404'))
    updateArticleConfig.mockResolvedValue({ state: null })

    // start disabled
    localStorage.setItem('poetry.effects.plumRain.enabled', 'false')

    const router = createTestRouter()
    await router.push('/parent')
    await router.isReady()

    const wrapper = mount(ParentView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const toggle = wrapper.find('[data-test="plum-rain-toggle"]')
    expect(toggle.exists()).toBe(true)

    // should reflect disabled state
    expect(toggle.element.checked).toBe(false)

    await toggle.setValue(true)
    expect(localStorage.getItem('poetry.effects.plumRain.enabled')).toBe('true')

    await toggle.setValue(false)
    expect(localStorage.getItem('poetry.effects.plumRain.enabled')).toBe('false')
  })

  it('renders difficulty default rules disclosure', async () => {
    const router = createTestRouter()
    await router.push('/parent')
    await router.isReady()

    const wrapper = mount(ParentView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.find('[data-test="difficulty-rules"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('难度 1')
    expect(wrapper.text()).toContain('1, 2, 5')
  })

  it('shows error when intervals are shorter than totalStages (level defaults editor)', async () => {
    const router = createTestRouter()
    await router.push('/parent')
    await router.isReady()

    const wrapper = mount(ParentView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    await wrapper.find('[data-test="level-select"]').setValue('1')
    await wrapper.find('[data-test="level-totalStages"]').setValue('5')
    await wrapper.find('[data-test="level-intervals"]').setValue('1,2')
    await wrapper.find('[data-test="level-save"]').trigger('click')

    expect(wrapper.find('[data-test="level-error"]').exists()).toBe(true)
    expect(updateDifficultyLevel).not.toHaveBeenCalled()
  })

  it('calls resetArticleToDefault when clicking reset', async () => {
    const router = createTestRouter()
    await router.push('/parent')
    await router.isReady()

    const wrapper = mount(ParentView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const btn = wrapper.find('[data-test="reset-btn-寅集-01"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')

    expect(resetArticleToDefault).toHaveBeenCalledWith('寅集-01')
  })

  it('calls overrideArticleSchedule when saving override', async () => {
    const router = createTestRouter()
    await router.push('/parent')
    await router.isReady()

    const wrapper = mount(ParentView, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const open = wrapper.find('[data-test="override-btn-寅集-01"]')
    expect(open.exists()).toBe(true)
    await open.trigger('click')

    await wrapper.find('[data-test="override-totalStages"]').setValue('3')
    await wrapper.find('[data-test="override-intervals"]').setValue('2,4,8')
    await wrapper.find('[data-test="override-save"]').trigger('click')

    expect(overrideArticleSchedule).toHaveBeenCalledWith('寅集-01', {
      totalStages: 3,
      intervals: [2, 4, 8]
    })
  })
})
