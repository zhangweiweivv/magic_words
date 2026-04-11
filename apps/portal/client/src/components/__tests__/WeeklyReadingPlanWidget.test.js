import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WeeklyReadingPlanWidget from '../WeeklyReadingPlanWidget.vue'

describe('WeeklyReadingPlanWidget', () => {
  it('renders header with title and time range', () => {
    const wrapper = mount(WeeklyReadingPlanWidget)
    expect(wrapper.text()).toContain('晨读计划')
    expect(wrapper.text()).toContain('07:15–07:35')
  })

  it('starts in expanded state (plan rows visible)', () => {
    const wrapper = mount(WeeklyReadingPlanWidget)
    expect(wrapper.find('.plan-grid').exists()).toBe(true)

    const rows = wrapper.findAll('.plan-row')
    expect(rows).toHaveLength(7)
  })

  it('collapses when expand button is clicked (toggle)', async () => {
    const wrapper = mount(WeeklyReadingPlanWidget)
    await wrapper.find('.expand-btn').trigger('click')

    expect(wrapper.find('.plan-grid').exists()).toBe(false)
  })

  it('shows correct day labels when expanded (default)', async () => {
    const wrapper = mount(WeeklyReadingPlanWidget)

    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    for (const day of days) {
      expect(wrapper.text()).toContain(day)
    }
  })

  it('shows correct activities per day when expanded (default)', async () => {
    const wrapper = mount(WeeklyReadingPlanWidget)

    const text = wrapper.text()
    // 周一/周五: 语文美文
    // 周三/周日: 语文古诗词
    // 周二/周四/周六: RAZ 英语阅读
    expect(text).toContain('语文美文')
    expect(text).toContain('语文古诗词')
    expect(text).toContain('RAZ 英语阅读')
  })

  it('does not provide a close button (cannot be closed)', async () => {
    const wrapper = mount(WeeklyReadingPlanWidget)
    expect(wrapper.find('.close-btn').exists()).toBe(false)
  })
})
