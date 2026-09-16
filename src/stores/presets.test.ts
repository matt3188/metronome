import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePresetsStore } from './presets'

describe('presets store', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })
  it('persists custom tempos in the order they were added and prevents duplicates', () => {
    const store = usePresetsStore()
    store.add(140); store.add(80); store.add(140); store.add(50); store.add(200); store.add(120)
    expect(store.tempos).toEqual([140, 80])
    expect(localStorage.getItem('metronome-presets')).toBe('[140,80]')
  })
  it('removes built-in tempos when loading saved custom tempos', () => {
    localStorage.setItem('metronome-presets', '[50,80,200,120,140]')
    setActivePinia(createPinia())

    expect(usePresetsStore().tempos).toEqual([80, 140])
  })
  it('reorders and removes custom tempos persistently', () => {
    const store = usePresetsStore()
    store.add(80); store.add(130); store.add(160)
    store.move(130, -1)
    expect(store.tempos).toEqual([130, 80, 160])
    store.move(130, -1)
    expect(store.tempos).toEqual([130, 80, 160])
    store.moveTo(130, 160)
    expect(store.tempos).toEqual([80, 160, 130])
    store.remove(80)
    expect(store.tempos).toEqual([160, 130])
    expect(localStorage.getItem('metronome-presets')).toBe('[160,130]')
  })
  it('persists the selected pitch with a custom tempo', () => {
    const store = usePresetsStore()
    store.add(130, 'low')

    expect(store.pitches[130]).toBe('low')
    expect(localStorage.getItem('metronome-preset-pitches')).toBe('{"130":"low"}')

    store.remove(130)
    expect(store.pitches[130]).toBeUndefined()
  })
  it('persists dashboard ordering and restores removed built-in tempos', () => {
    const store = usePresetsStore()
    store.add(80)
    store.moveDashboard(80, -1)
    store.removeFromDashboard(50)

    expect(store.dashboardTempos).toEqual([200, 80, 120])
    expect(store.removedTempos).toEqual([50])
    expect(localStorage.getItem('metronome-dashboard-tempos')).toBe('[200,80,120]')

    store.restoreBuiltIn(50)
    expect(store.dashboardTempos).toEqual([200, 80, 120, 50])

    store.moveDashboardTo(50, 80)
    expect(store.dashboardItems).toEqual([200, 50, 120, 80])
    expect(localStorage.getItem('metronome-dashboard-tempos')).toBe('[200,50,120,80]')
  })
  it('drops the retired Custom tile from a saved dashboard layout', () => {
    localStorage.setItem('metronome-dashboard-tempos', '[50,"custom",200,120]')
    setActivePinia(createPinia())

    expect(usePresetsStore().dashboardItems).toEqual([50, 200, 120])
  })
  it('moves a hidden custom tempo to the tray without deleting its saved settings', () => {
    const store = usePresetsStore()
    store.add(135, 'low')

    store.removeFromDashboard(135)

    expect(store.removedTempos).toContain(135)
    expect(store.tempos).toContain(135)
    expect(store.pitches[135]).toBe('low')

    store.restoreTempo(135)
    expect(store.dashboardTempos).toContain(135)
    expect(store.removedTempos).not.toContain(135)
  })

  it('reorders all visible tempos and lets removed presets be restored', () => {
    const store = usePresetsStore()
    store.add(120)

    store.moveTo(120, 0)
    expect(store.visibleTempos).toEqual([120, 50, 100])

    store.remove(50)
    expect(store.visibleTempos).toEqual([120, 100])
    expect(store.availablePresets).toEqual([50])

    store.restorePreset(50)
    expect(store.visibleTempos).toEqual([120, 100, 50])
    expect(store.availablePresets).toEqual([])
    expect(JSON.parse(localStorage.getItem('metronome-tempo-layout') ?? '{}')).toEqual({
      order: [120, 100, 50],
      hiddenPresets: [],
    })
  })
})
