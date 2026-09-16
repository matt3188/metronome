import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TempoButton from '../components/TempoButton.vue'
import BpmDial from '../components/BpmDial.vue'
import { useMetronomeStore } from '../stores/metronome'
import { usePresetsStore } from '../stores/presets'
import HomeView from './HomeView.vue'

vi.mock('../services/metronome', () => ({
  metronomeService: {
    start: vi.fn().mockResolvedValue(undefined),
    setTempo: vi.fn(),
    setPitch: vi.fn(),
    stop: vi.fn(),
  },
}))

describe('HomeView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(document, 'elementsFromPoint')
  })

  it('makes built-in and saved tempos manageable without a Custom tile', async () => {
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
      '200',
      '120',
      '80',
    ])

    await wrapper.get('.tempo-grid-heading button').trigger('click')

    expect(wrapper.findAll('.preset-lock')).toHaveLength(0)
    expect(wrapper.findAll('.tempo-actions')).toHaveLength(4)
    expect(wrapper.get('[data-tempo="50"] .remove-tempo').attributes('aria-label')).toBe(
      'Remove 50 BPM from dashboard',
    )
    expect(wrapper.get('[data-tempo="80"] .remove-tempo').attributes('aria-label')).toBe(
      'Remove 80 BPM from dashboard',
    )
    expect(wrapper.find('.custom-tile').exists()).toBe(false)
  })

  it('starts the metronome when a tempo is tapped', async () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })

    await wrapper.get('[data-tempo="50"] .tempo-card').trigger('click')

    expect(useMetronomeStore().bpm).toBe(50)
    expect(useMetronomeStore().isPlaying).toBe(true)
    expect(wrapper.find('.primary').exists()).toBe(false)
  })

  it('places the play and pause control between the dial and tempo tiles', async () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    const control = wrapper.get('.playback-toggle')
    const children = wrapper.element.children

    expect(children.item(2)?.classList.contains('dashboard-playback')).toBe(true)
    expect(children.item(3)?.classList.contains('tempo-grid-heading')).toBe(true)
    expect(control.attributes('aria-label')).toBe('Play metronome')
    expect(control.attributes('aria-checked')).toBe('false')

    await control.trigger('click')

    expect(useMetronomeStore().isPlaying).toBe(true)
    expect(control.attributes('aria-label')).toBe('Pause metronome')
    expect(control.attributes('aria-checked')).toBe('true')
  })

  it('keeps the dashboard dial and presets synchronized', async () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    const dial = wrapper.getComponent(BpmDial)

    await wrapper.get('[data-tempo="50"] .tempo-card').trigger('click')
    expect(dial.props('modelValue')).toBe(50)

    dial.vm.$emit('update:modelValue', 72)
    await wrapper.vm.$nextTick()
    expect(useMetronomeStore().bpm).toBe(72)
    expect(wrapper.find('.tempo-card.active').exists()).toBe(false)
  })

  it('adds a tempo selected with the dial to the presets', async () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    const dial = wrapper.getComponent(BpmDial)

    dial.vm.$emit('update:modelValue', 72)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.add-preset').text()).toContain('Add 72 BPM')
    await wrapper.get('.add-preset').trigger('click')

    expect(usePresetsStore().dashboardTempos).toEqual([50, 200, 120, 72])
    expect(wrapper.get('[data-tempo="72"]').exists()).toBe(true)
    expect(wrapper.get('.add-preset').attributes('disabled')).toBeDefined()
  })

  it('reorders all dashboard tempos by drag target', async () => {
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
    const targetCard = cards.find(card => card.props('bpm') === 120)!.element
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: vi.fn(() => [targetCard]),
    })

    cards.find(card => card.props('bpm') === 80)!.vm.$emit('dragmove', { x: 10, y: 10 })
    await wrapper.vm.$nextTick()

    expect(usePresetsStore().dashboardTempos).toEqual([50, 200, 80, 120])
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

    expect(usePresetsStore().dashboardTempos).toEqual([50, 200, 80, 120])
    wrapper.unmount()
  })

  it('lets a removed built-in preset be restored in management mode', async () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })

    await wrapper.get('.tempo-grid-heading button').trigger('click')
    await wrapper.get('[data-tempo="50"] .remove-tempo').trigger('click')

    expect(usePresetsStore().dashboardTempos).toEqual([200, 120])
    expect(wrapper.get('.removed-presets button').text()).toContain('50 BPM')

    await wrapper.get('.removed-presets button').trigger('click')
    expect(usePresetsStore().dashboardTempos).toEqual([200, 120, 50])
  })

})
