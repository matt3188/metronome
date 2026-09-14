import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TempoButton from '../components/TempoButton.vue'
import { usePresetsStore } from '../stores/presets'
import HomeView from './HomeView.vue'

describe('HomeView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(document, 'elementsFromPoint')
  })

  it('keeps built-in tempos ahead of saved custom tempos and locks only the built-ins', async () => {
    localStorage.setItem('metronome-presets', '[80]')
    setActivePinia(createPinia())

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })

    expect(wrapper.findAll('[data-tempo]').map(card => card.attributes('data-tempo'))).toEqual([
      '50',
      '100',
      '80',
    ])

    await wrapper.get('.tempo-grid-heading button').trigger('click')

    expect(wrapper.findAll('.preset-lock')).toHaveLength(2)
    expect(wrapper.findAll('.tempo-actions')).toHaveLength(1)
    expect(wrapper.get('[data-tempo="80"] .remove-tempo').attributes('aria-label')).toBe(
      'Remove 80 BPM',
    )
  })

  it('reorders custom tempos without treating overlapping built-ins as drag targets', async () => {
    localStorage.setItem('metronome-presets', '[80,120]')
    setActivePinia(createPinia())

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    const cards = wrapper.findAllComponents(TempoButton)
    const builtInCard = cards[0].element
    const targetCard = cards.find(card => card.props('bpm') === 120)!.element
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: vi.fn(() => [builtInCard, targetCard]),
    })

    cards.find(card => card.props('bpm') === 80)!.vm.$emit('dragmove', { x: 10, y: 10 })
    await wrapper.vm.$nextTick()

    expect(usePresetsStore().tempos).toEqual([120, 80])
  })

  it('reorders from card geometry when mobile hit testing only returns the captured tile', async () => {
    localStorage.setItem('metronome-presets', '[80,120]')
    setActivePinia(createPinia())

    const wrapper = mount(HomeView, {
      attachTo: document.body,
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    const cards = wrapper.findAllComponents(TempoButton)
    const draggedCard = cards.find(card => card.props('bpm') === 80)!.element
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      const isTarget = this.dataset.tempo === '120'
      return {
        left: isTarget ? 100 : 0,
        right: isTarget ? 200 : 0,
        top: isTarget ? 100 : 0,
        bottom: isTarget ? 300 : 0,
        width: isTarget ? 100 : 0,
        height: isTarget ? 200 : 0,
        x: isTarget ? 100 : 0,
        y: isTarget ? 100 : 0,
        toJSON: () => ({}),
      }
    })
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: vi.fn(() => [draggedCard]),
    })

    cards.find(card => card.props('bpm') === 80)!.vm.$emit('dragmove', { x: 150, y: 200 })
    await wrapper.vm.$nextTick()

    expect(usePresetsStore().tempos).toEqual([120, 80])
    wrapper.unmount()
  })
})
