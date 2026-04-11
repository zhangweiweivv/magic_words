import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from '../HomeView.vue'

// Mock the API module
vi.mock('../../api/index.js', () => ({
  fetchDueList: vi.fn()
}))

import { fetchDueList } from '../../api/index.js'

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
})
