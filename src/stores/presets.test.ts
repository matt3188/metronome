import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePresetsStore } from './presets'

describe('presets store', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })
  it('persists sorted tempos and prevents duplicates', () => {
    const store = usePresetsStore()
    store.add(120); store.add(80); store.add(120); store.add(50)
    expect(store.tempos).toEqual([80, 120])
    expect(localStorage.getItem('metronome-presets')).toBe('[80,120]')
  })
})
