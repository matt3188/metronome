import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BpmDial from './BpmDial.vue'

describe('BpmDial', () => {
  const mountDial = () => {
    const wrapper = mount(BpmDial, { props: { modelValue: 135, active: false } })
    wrapper.get('.dial').element.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    })
    return wrapper
  }

  it('maps the finger position around the dial to its displayed arc', async () => {
    const wrapper = mountDial()
    const dial = wrapper.get('.dial')

    await dial.trigger('pointerdown', { pointerId: 1, clientX: 100, clientY: 0 })
    await dial.trigger('pointermove', { pointerId: 1, clientX: 200, clientY: 100 })
    await dial.trigger('pointerup', { pointerId: 1 })

    expect(wrapper.emitted('update:modelValue')).toEqual([[135], [205]])
  })

  it('clamps touches in the unused bottom arc to the nearest endpoint', async () => {
    const minimum = mountDial()
    const maximum = mountDial()

    await minimum.get('.dial').trigger('pointerdown', { pointerId: 1, clientX: 25, clientY: 175 })
    await maximum.get('.dial').trigger('pointerdown', { pointerId: 2, clientX: 175, clientY: 175 })

    expect(minimum.emitted('update:modelValue')).toEqual([[30]])
    expect(maximum.emitted('update:modelValue')).toEqual([[240]])
  })

  it('retains native range keyboard controls', async () => {
    const wrapper = mountDial()
    const input = wrapper.get('input')

    await input.setValue(136)

    expect(wrapper.emitted('update:modelValue')).toEqual([[136]])
  })
})
