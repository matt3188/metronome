import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TempoButton from './TempoButton.vue'

describe('TempoButton', () => {
  afterEach(() => vi.useRealTimers())

  it('enters edit mode on a long press without also playing the tempo', async () => {
    vi.useFakeTimers()
    const wrapper = mount(TempoButton, { props: { bpm: 120, active: false } })
    const button = wrapper.get('.tempo-card')

    await button.trigger('pointerdown')
    await vi.advanceTimersByTimeAsync(550)
    await button.trigger('pointerup')
    await button.trigger('click')

    expect(wrapper.emitted('longpress')).toHaveLength(1)
    expect(wrapper.emitted('press')).toBeUndefined()
  })

  it('shows remove and reorder controls only for editable custom tempos', () => {
    const custom = mount(TempoButton, { props: { bpm: 120, active: false, editing: true } })
    const preset = mount(TempoButton, { props: { bpm: 100, active: false, editing: true, preset: true } })

    expect(custom.find('[aria-label="Remove 120 BPM"]').exists()).toBe(true)
    expect(preset.find('[aria-label="Remove 100 BPM"]').exists()).toBe(false)
    expect(preset.find('.preset-lock').exists()).toBe(true)
  })

  it('reports pointer movement after a long press for drag reordering', async () => {
    vi.useFakeTimers()
    const wrapper = mount(TempoButton, { props: { bpm: 120, active: false } })
    const button = wrapper.get('.tempo-card')

    await button.trigger('pointerdown', { pointerId: 1 })
    await vi.advanceTimersByTimeAsync(550)
    await button.trigger('pointermove', { clientX: 20, clientY: 30 })
    await button.trigger('pointerup', { pointerId: 1 })

    expect(wrapper.emitted('dragmove')).toEqual([[{ x: 20, y: 30 }]])
    expect(wrapper.emitted('dragend')).toHaveLength(1)
  })

  it('marks the tempo being dragged', async () => {
    const wrapper = mount(TempoButton, {
      props: { bpm: 120, active: false, editing: true, canMoveLater: true },
    })

    expect(wrapper.classes()).not.toContain('dragging')
    await wrapper.setProps({ dragging: true })
    expect(wrapper.classes()).toContain('dragging')
  })

  it('identifies only custom tempos as drag targets', () => {
    const custom = mount(TempoButton, { props: { bpm: 120, active: false } })
    const builtIn = mount(TempoButton, { props: { bpm: 100, active: false, preset: true } })

    expect(custom.attributes('data-custom-tempo')).toBe('')
    expect(builtIn.attributes()).not.toHaveProperty('data-custom-tempo')
  })
})
