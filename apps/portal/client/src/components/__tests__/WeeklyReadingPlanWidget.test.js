import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WeeklyReadingPlanWidget from '../WeeklyReadingPlanWidget.vue'

describe('WeeklyReadingPlanWidget', () => {
  it('renders header with title and time range', () => {
    const wrapper = mount(WeeklyReadingPlanWidget)
    expect(wrapper.text()).toContain('晨读计划')
    expect(wrapper.text()).toContain('07:15–07:35')
  })

  it('starts in collapsed state (plan rows not visible)', () => {
    const wrapper = mount(WeeklyReadingPlanWidget)
    expect(wrapper.find('.plan-grid').exists()).toBe(false)
  })

  it('expands to show 7 day rows when expand button is clicked', async () => {
    const wrapper = mount(WeeklyReadingPlanWidget)
    await wrapper.find('.expand-btn').trigger('click')

    expect(wrapper.find('.plan-grid').exists()).toBe(true)

    const rows = wrapper.findAll('.plan-row')
    expect(rows).toHaveLength(7)
  })

  it('shows correct day labels when expanded', async () => {
    const wrapper = mount(WeeklyReadingPlanWidget)
    await wrapper.find('.expand-btn').trigger('click')

    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    for (const day of days) {
      expect(wrapper.text()).toContain(day)
    }
  })

  it('shows correct activities per day when expanded', async () => {
    const wrapper = mount(WeeklyReadingPlanWidget)
    await wrapper.find('.expand-btn').trigger('click')

    const text = wrapper.text()
    // 周一/周五: 语文美文
    // 周三/周日: 语文古诗词
    // 周二/周四/周六: RAZ 英语阅读
    expect(text).toContain('语文美文')
    expect(text).toContain('语文古诗词')
    expect(text).toContain('RAZ 英语阅读')
  })

  it('hides widget when close button is clicked', async () => {
    const wrapper = mount(WeeklyReadingPlanWidget)
    await wrapper.find('.close-btn').trigger('click')

    expect(wrapper.find('.weekly-plan-widget').exists()).toBe(false)
  })
})
