import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePresetsStore } from './presets'

describe('presets store', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })
  it('persists tempos in the order they were added and prevents duplicates', () => {
    const store = usePresetsStore()
    store.add(120); store.add(80); store.add(120); store.add(50)
    expect(store.tempos).toEqual([120, 80])
    expect(localStorage.getItem('metronome-presets')).toBe('[120,80]')
  })
  it('reorders and removes custom tempos persistently', () => {
    const store = usePresetsStore()
    store.add(80); store.add(120); store.add(160)
    store.move(120, -1)
    expect(store.tempos).toEqual([120, 80, 160])
    store.move(120, -1)
    expect(store.tempos).toEqual([120, 80, 160])
    store.remove(80)
    expect(store.tempos).toEqual([120, 160])
    expect(localStorage.getItem('metronome-presets')).toBe('[120,160]')
  })
})
