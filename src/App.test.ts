import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import { useMetronomeStore } from './stores/metronome'

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
})
