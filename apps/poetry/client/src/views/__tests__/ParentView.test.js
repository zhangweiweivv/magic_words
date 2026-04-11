import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ParentView from '../ParentView.vue'

vi.mock('../../api/index.js', () => ({
  fetchArticleState: vi.fn(),
  updateArticleConfig: vi.fn()
}))

import { fetchArticleState, updateArticleConfig } from '../../api/index.js'

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
})
