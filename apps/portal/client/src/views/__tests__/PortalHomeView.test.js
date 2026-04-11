import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PortalHomeView from '../PortalHomeView.vue'

describe('PortalHomeView', () => {
  it('shows a Typing Master room card that opens in a new tab', () => {
    const wrapper = mount(PortalHomeView)

    const card = wrapper.findAll('a').find(a => a.text().includes('Typing Master'))
    expect(card, 'Typing Master card should exist').toBeTruthy()

    expect(card.attributes('href')).toBe('https://mango-smoke-0c143a30f.4.azurestaticapps.net/')
    expect(card.attributes('target')).toBe('_blank')

    const rel = card.attributes('rel') || ''
    expect(rel).toContain('noopener')
  })
})
