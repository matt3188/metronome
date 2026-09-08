import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from './theme'

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    setActivePinia(createPinia())
  })

  it('applies and persists a changed theme', () => {
    const store = useThemeStore()
    expect(store.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')

    store.toggle()

    expect(store.theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('metronome-theme')).toBe('light')
  })

  it('restores a saved theme', () => {
    localStorage.setItem('metronome-theme', 'light')
    const store = useThemeStore()
    expect(store.theme).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })
})
