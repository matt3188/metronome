import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TempoButton from '../components/TempoButton.vue'
import BpmDial from '../components/BpmDial.vue'
import { useMetronomeStore } from '../stores/metronome'
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

  it('makes built-in and custom tempos manageable', async () => {
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

    expect(wrapper.findAll('.preset-lock')).toHaveLength(0)
    expect(wrapper.findAll('.tempo-actions')).toHaveLength(4)
    expect(wrapper.get('[data-tempo="50"] .remove-tempo').attributes('aria-label')).toBe(
      'Remove 50 BPM from dashboard',
    )
    expect(wrapper.get('[data-tempo="80"] .remove-tempo').attributes('aria-label')).toBe(
      'Remove 80 BPM from dashboard',
    )
    expect(wrapper.find('.custom-tile .remove-tempo').exists()).toBe(false)

    await wrapper.get('[aria-label="Move Custom tile earlier"]').trigger('click')
    expect(usePresetsStore().dashboardItems).toEqual([50, 100, 'custom', 80])
    expect(localStorage.getItem('metronome-dashboard-tempos')).toBe('[50,100,"custom",80]')
  })

  it('selects a tempo without starting a second, local playback control', async () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })

    await wrapper.get('[data-tempo="50"] .tempo-card').trigger('click')

    expect(useMetronomeStore().bpm).toBe(50)
    expect(useMetronomeStore().isPlaying).toBe(false)
    expect(wrapper.find('.primary').exists()).toBe(false)
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

    expect(usePresetsStore().dashboardTempos).toEqual([50, 100, 120, 80])
  })

  it('reorders the Custom tile by drag target', async () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await wrapper.get('.tempo-grid-heading button').trigger('click')
    const targetCard = wrapper.get('[data-tempo="50"]').element
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: vi.fn(() => [targetCard]),
    })

    const customCard = wrapper.get('.custom-card')
    await customCard.trigger('pointerdown', { pointerId: 1, clientX: 0, clientY: 0 })
    await customCard.trigger('pointermove', { pointerId: 1, clientX: 10, clientY: 10 })

    expect(usePresetsStore().dashboardItems).toEqual(['custom', 100, 50])
    expect(localStorage.getItem('metronome-dashboard-tempos')).toBe('["custom",100,50]')
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

    expect(usePresetsStore().dashboardTempos).toEqual([50, 100, 120, 80])
    wrapper.unmount()
  })

  it('lets a removed built-in preset be restored in management mode', async () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })

    await wrapper.get('.tempo-grid-heading button').trigger('click')
    await wrapper.get('[data-tempo="50"] .remove-tempo').trigger('click')

    expect(usePresetsStore().dashboardTempos).toEqual([100])
    expect(wrapper.get('.removed-presets button').text()).toContain('50 BPM')

    await wrapper.get('.removed-presets button').trigger('click')
    expect(usePresetsStore().dashboardTempos).toEqual([100, 50])
  })

})
