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
    // Small finger movements can leave the hit-tested element on touchscreens;
    // pointer capture must keep the hold active rather than canceling it.
    await button.trigger('pointerleave')
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

  it('shakes a movable custom tempo only until it has moved', async () => {
    const wrapper = mount(TempoButton, {
      props: { bpm: 120, active: false, editing: true, canMoveLater: true },
    })

    expect(wrapper.classes()).toContain('movable')
    await wrapper.setProps({ moved: true })
    expect(wrapper.classes()).not.toContain('movable')
  })
})
