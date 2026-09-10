import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import HomeView from './HomeView.vue'

describe('HomeView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
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
})
