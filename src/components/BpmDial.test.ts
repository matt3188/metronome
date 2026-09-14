import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import BpmDial from './BpmDial.vue'

describe('BpmDial', () => {
  it('changes tempo while dragging around the dial', async () => {
    const wrapper = mount(BpmDial, { props: { modelValue: 100, active: false } })
    const dial = wrapper.get('.dial')
    vi.spyOn(dial.element, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200, x: 0, y: 0, toJSON: () => ({}),
    })

    await dial.trigger('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 29, clientY: 171 })
    await dial.trigger('pointermove', { pointerId: 1, pointerType: 'touch', clientX: 29, clientY: 29 })

    expect(wrapper.emitted('update:modelValue')).toEqual([[30], [100]])
  })

  it('keeps the range input available for keyboard changes', async () => {
    const wrapper = mount(BpmDial, { props: { modelValue: 100, active: false } })
    const input = wrapper.get('input')

    await input.setValue(120)

    expect(wrapper.emitted('update:modelValue')).toEqual([[120]])
  })
})
