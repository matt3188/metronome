import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePresetsStore } from './presets'

describe('presets store', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })
  it('persists custom tempos in the order they were added and prevents duplicates', () => {
    const store = usePresetsStore()
    store.add(120); store.add(80); store.add(120); store.add(50); store.add(100)
    expect(store.tempos).toEqual([120, 80])
    expect(localStorage.getItem('metronome-presets')).toBe('[120,80]')
  })
  it('removes built-in tempos when loading saved custom tempos', () => {
    localStorage.setItem('metronome-presets', '[50,80,100,120]')
    setActivePinia(createPinia())

    expect(usePresetsStore().tempos).toEqual([80, 120])
  })
  it('reorders and removes custom tempos persistently', () => {
    const store = usePresetsStore()
    store.add(80); store.add(120); store.add(160)
    store.move(120, -1)
    expect(store.tempos).toEqual([120, 80, 160])
    store.move(120, -1)
    expect(store.tempos).toEqual([120, 80, 160])
    store.moveTo(120, 160)
    expect(store.tempos).toEqual([80, 160, 120])
    store.remove(80)
    expect(store.tempos).toEqual([160, 120])
    expect(localStorage.getItem('metronome-presets')).toBe('[160,120]')
  })
})
