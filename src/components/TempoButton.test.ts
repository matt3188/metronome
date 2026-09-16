import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TempoButton from './TempoButton.vue'

const pointerEvent = (type: string, properties: Record<string, number>) => {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperties(event, Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [key, { value }]),
  ))
  return event
}

describe('TempoButton', () => {
  afterEach(() => vi.useRealTimers())

  it('enters edit mode on a long press without also playing the tempo', async () => {
    vi.useFakeTimers()
    const wrapper = mount(TempoButton, { props: { bpm: 120, active: false } })
    const button = wrapper.get('.tempo-card')

    await button.trigger('pointerdown', { pointerId: 1 })
    await vi.advanceTimersByTimeAsync(550)
    window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1 }))
    await wrapper.vm.$nextTick()
    await button.trigger('click')

    expect(wrapper.emitted('longpress')).toHaveLength(1)
    expect(wrapper.emitted('press')).toBeUndefined()
  })

  it('shows remove and reorder controls for custom and preset tempos', () => {
    const custom = mount(TempoButton, { props: { bpm: 120, active: false, editing: true } })
    const preset = mount(TempoButton, { props: { bpm: 100, active: false, editing: true, preset: true } })

    expect(custom.find('[aria-label="Remove 120 BPM"]').exists()).toBe(true)
    expect(preset.find('[aria-label="Remove 100 BPM"]').exists()).toBe(true)
    expect(preset.attributes('draggable')).toBe('true')
  })

  it('reports pointer movement after a long press for drag reordering', async () => {
    vi.useFakeTimers()
    const wrapper = mount(TempoButton, { props: { bpm: 120, active: false } })
    const button = wrapper.get('.tempo-card')

    await button.trigger('pointerdown', { pointerId: 1 })
    await vi.advanceTimersByTimeAsync(550)
    window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 20, clientY: 30 }))
    await wrapper.vm.$nextTick()

    expect(wrapper.classes()).toContain('dragging')
    expect(wrapper.attributes('style')).toContain('--drag-x: 20px')
    expect(wrapper.attributes('style')).toContain('--drag-y: 30px')

    window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1 }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('dragmove')).toEqual([[{ x: 20, y: 30 }]])
    expect(wrapper.emitted('dragend')).toHaveLength(1)
    expect(wrapper.classes()).not.toContain('dragging')
    expect(wrapper.attributes('style')).toBeUndefined()
  })

  it('starts dragging custom tempos immediately while in edit mode', async () => {
    vi.useFakeTimers()
    const wrapper = mount(TempoButton, {
      props: { bpm: 120, active: false, editing: true },
    })
    const button = wrapper.get('.tempo-card')

    await button.trigger('pointerdown', { pointerId: 1 })
    window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 20, clientY: 30 }))
    window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1 }))
    await wrapper.vm.$nextTick()
    await button.trigger('click')

    expect(wrapper.emitted('dragmove')).toEqual([[{ x: 20, y: 30 }]])
    expect(wrapper.emitted('dragend')).toHaveLength(1)
    expect(wrapper.emitted('longpress')).toBeUndefined()
    expect(wrapper.emitted('press')).toBeUndefined()
  })

  it('prevents native touch gestures while preserving a quick tap', async () => {
    const wrapper = mount(TempoButton, { props: { bpm: 120, active: false } })
    const button = wrapper.get('.tempo-card')
    const pointerDown = new Event('pointerdown', { bubbles: true, cancelable: true })
    Object.defineProperties(pointerDown, {
      pointerId: { value: 1 },
      pointerType: { value: 'touch' },
      clientX: { value: 10 },
      clientY: { value: 20 },
    })

    button.element.dispatchEvent(pointerDown)
    await button.trigger('pointerup', { pointerId: 1, pointerType: 'touch' })

    expect(pointerDown.defaultPrevented).toBe(true)
    expect(wrapper.emitted('press')).toHaveLength(1)
  })

  it('keeps touch movement available after holding instead of selecting text', async () => {
    vi.useFakeTimers()
    const wrapper = mount(TempoButton, { props: { bpm: 120, active: false } })
    const button = wrapper.get('.tempo-card')

    await button.trigger('pointerdown', {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 10,
      clientY: 20,
    })
    await vi.advanceTimersByTimeAsync(550)
    await button.trigger('pointermove', { pointerId: 1, clientX: 35, clientY: 60 })

    expect(wrapper.attributes('style')).toContain('--drag-x: 25px')
    expect(wrapper.attributes('style')).toContain('--drag-y: 40px')
    expect(wrapper.emitted('dragmove')).toEqual([[{ x: 35, y: 60 }]])
  })

  it('makes built-in tempos draggable in edit mode', async () => {
    const wrapper = mount(TempoButton, {
      props: { bpm: 100, active: false, editing: true, preset: true },
    })
    const button = wrapper.get('.tempo-card')

    await button.trigger('pointerdown', { pointerId: 1 })
    window.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 20, clientY: 30 }))
    window.dispatchEvent(pointerEvent('pointerup', { pointerId: 1 }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('dragmove')).toEqual([[{ x: 20, y: 30 }]])
  })

  it('marks the tempo being dragged', async () => {
    const wrapper = mount(TempoButton, {
      props: { bpm: 120, active: false, editing: true, canMoveLater: true },
    })

    expect(wrapper.classes()).not.toContain('dragging')
    await wrapper.setProps({ dragging: true })
    expect(wrapper.classes()).toContain('dragging')
  })

  it('identifies every dashboard tempo as a drag target', () => {
    const custom = mount(TempoButton, { props: { bpm: 120, active: false } })
    const builtIn = mount(TempoButton, { props: { bpm: 100, active: false, preset: true } })

    expect(custom.attributes('data-dashboard-tempo')).toBe('120')
    expect(builtIn.attributes('data-dashboard-tempo')).toBe('100')
  })
})
