import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import { useMetronomeStore } from './stores/metronome'

const pwa = vi.hoisted(() => ({ onUpdate: undefined as (() => void) | undefined, apply: vi.fn() }))

vi.mock('./services/pwa', () => ({
  watchForPwaUpdates: vi.fn((onUpdate: (update: { apply: () => void, changes: readonly string[] }) => void) => {
    pwa.onUpdate = () => onUpdate({
      apply: pwa.apply,
      changes: ['Faster update checks.', 'Clear release notes.'],
    })
    return vi.fn()
  }),
}))

vi.mock('./services/metronome', () => ({
  metronomeService: {
    start: vi.fn().mockResolvedValue(undefined),
    setPitch: vi.fn(),
    stop: vi.fn(),
  },
}))

describe('App pitch toggle', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    setActivePinia(createPinia())
    pwa.apply.mockClear()
  })

  it('switches between high and low pitch from the header', async () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: true,
        },
      },
    })
    const toggle = wrapper.get('.pitch-toggle')

    expect(toggle.attributes('aria-checked')).toBe('false')
    expect(toggle.attributes('aria-label')).toBe('Switch to low pitch')

    await toggle.trigger('click')

    expect(useMetronomeStore().pitch).toBe('low')
    expect(toggle.attributes('aria-checked')).toBe('true')
    expect(toggle.attributes('aria-label')).toBe('Switch to high pitch')
  })

  it('leaves playback controls to the routed page', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: true,
        },
      },
    })
    expect(wrapper.find('.playback-toggle').exists()).toBe(false)
    expect(wrapper.find('.now-playing .playback-toggle').exists()).toBe(false)
    expect(wrapper.get('.now-playing-label').text()).toBe('Ready to play')
  })

  it('offers to activate a newly available version', async () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: true,
        },
      },
    })

    expect(wrapper.find('.update-notice').exists()).toBe(false)
    pwa.onUpdate?.()
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.update-notice').text()).toContain('A new version of Metronome is ready.')
    expect(wrapper.get('.update-notice').text()).toContain("What's new")
    expect(wrapper.findAll('.update-notice li').map((item) => item.text())).toEqual([
      'Faster update checks.',
      'Clear release notes.',
    ])
    await wrapper.get('.update-notice button').trigger('click')
    expect(pwa.apply).toHaveBeenCalledOnce()
  })
})
