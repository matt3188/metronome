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
  it('persists, trims, and removes custom labels for any preset', () => {
    const store = usePresetsStore()
    store.setLabel(50, '  Warm-up  ')
    store.add(135, 'low', 'Practice groove')

    expect(store.labels).toEqual({ 50: 'Warm-up', 135: 'Practice groove' })
    expect(localStorage.getItem('metronome-preset-labels')).toBe('{"50":"Warm-up","135":"Practice groove"}')

    store.setLabel(50, '   ')
    setActivePinia(createPinia())
    expect(usePresetsStore().labels).toEqual({ 135: 'Practice groove' })
  })

  it('carries a label to an overwritten tempo', () => {
    const store = usePresetsStore()
    store.setLabel(50, 'Slow practice')

    store.overwrite(50, 72, 'high')

    expect(store.labels[50]).toBeUndefined()
    expect(store.labels[72]).toBe('Slow practice')
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

  it('overwrites a dashboard preset in place and persists its pitch', () => {
    const store = usePresetsStore()

    store.overwrite(50, 72, 'low')

    expect(store.dashboardTempos).toEqual([72, 200, 120])
    expect(store.tempos).toEqual([72])
    expect(store.pitches[72]).toBe('low')
    expect(localStorage.getItem('metronome-dashboard-tempos')).toBe('[72,200,120]')
    expect(localStorage.getItem('metronome-presets')).toBe('[72]')
  })

  it('reorders dashboard tempos and lets removed presets be restored', () => {
    const store = usePresetsStore()
    store.add(100)

    store.moveDashboardTo(100, 50)
    expect(store.dashboardTempos).toEqual([100, 200, 120, 50])

    store.removeFromDashboard(50)
    expect(store.removedTempos).toEqual([50])

    store.restoreTempo(50)
    expect(store.dashboardTempos).toEqual([100, 200, 120, 50])
    expect(store.removedTempos).toEqual([])
  })
})
