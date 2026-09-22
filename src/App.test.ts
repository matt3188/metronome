import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import { useMetronomeStore } from './stores/metronome'

const pwa = vi.hoisted(() => ({ onUpdate: undefined as (() => void) | undefined, apply: vi.fn() }))

vi.mock('./services/pwa', () => ({
  watchForPwaUpdates: vi.fn((onUpdate: (update: { apply: () => void }) => void) => {
    pwa.onUpdate = () => onUpdate({ apply: pwa.apply })
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
    await wrapper.get('.update-notice button').trigger('click')
    expect(pwa.apply).toHaveBeenCalledOnce()
  })

  it('opens a simple feedback form from the footer', async () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: true,
        },
      },
    })

    expect(wrapper.find('.feedback-dialog').exists()).toBe(false)
    await wrapper.get('.feedback-link').trigger('click')

    expect(wrapper.get('.feedback-dialog').attributes('aria-modal')).toBe('true')
    expect(wrapper.get('[name="feedback_type"]').text()).toContain('Something isn’t working')
    expect(wrapper.get('[name="message"]').attributes('required')).toBeDefined()
    expect(wrapper.get('[name="email"]').attributes('required')).toBeUndefined()
  })

  it('submits feedback to Formspree and confirms success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          RouterView: true,
        },
      },
    })

    await wrapper.get('.feedback-link').trigger('click')
    await wrapper.get('[name="message"]').setValue('Please add a tap tempo button.')
    await wrapper.get('.feedback-dialog form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.get('.feedback-dialog').text()).toContain('Thanks for helping!'))

    expect(fetchMock).toHaveBeenCalledWith('https://formspree.io/f/xqpaqjnn', expect.objectContaining({ method: 'POST' }))
  })
})
