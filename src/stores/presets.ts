import { defineStore } from 'pinia'
import { BUILT_IN_TEMPOS, isBuiltInTempo } from '../constants/tempos'
import type { MetronomePitch } from '../services/metronome'

const KEY = 'metronome-presets'
const PITCH_KEY = 'metronome-preset-pitches'
const DASHBOARD_KEY = 'metronome-dashboard-tempos'
export const CUSTOM_TILE = 'custom' as const
export type DashboardItem = number | typeof CUSTOM_TILE
const load = (): number[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(saved)
      ? [...new Set(saved.filter((value): value is number => Number.isInteger(value) && value >= 30 && value <= 240 && !isBuiltInTempo(value)))]
      : []
  } catch { return [] }
}
const loadPitches = (): Record<number, MetronomePitch> => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(PITCH_KEY) ?? '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return Object.fromEntries(Object.entries(saved).filter(([, pitch]) => pitch === 'high' || pitch === 'low'))
  } catch { return {} }
}
const loadDashboard = (customTempos: number[]): DashboardItem[] => {
  const available = [...BUILT_IN_TEMPOS, ...customTempos]
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(DASHBOARD_KEY) ?? 'null')
    if (!Array.isArray(saved)) return [...available, CUSTOM_TILE]
    const ordered = [...new Set(saved.filter((value): value is DashboardItem => (
      value === CUSTOM_TILE || (Number.isInteger(value) && available.includes(value as number))
    )))]
    // A newly-created custom tempo should still appear even when a layout was
    // saved before it existed. Missing built-ins, however, remain intentionally hidden.
    const withNewTempos = [...ordered, ...customTempos.filter(tempo => !ordered.includes(tempo))]
    return withNewTempos.includes(CUSTOM_TILE) ? withNewTempos : [...withNewTempos, CUSTOM_TILE]
  } catch { return [...available, CUSTOM_TILE] }
}

export const usePresetsStore = defineStore('presets', {
  state: () => {
    const tempos = load()
    return { tempos, dashboardItems: loadDashboard(tempos), pitches: loadPitches() }
  },
  getters: {
    dashboardTempos: state => state.dashboardItems.filter((item): item is number => typeof item === 'number'),
    removedBuiltIns: state => BUILT_IN_TEMPOS.filter(tempo => !state.dashboardItems.includes(tempo)),
  },
  actions: {
    add(bpm: number, pitch: MetronomePitch = 'high') {
      if (!isBuiltInTempo(bpm) && !this.tempos.includes(bpm)) {
        this.tempos.push(bpm)
        const customIndex = this.dashboardItems.indexOf(CUSTOM_TILE)
        this.dashboardItems.splice(customIndex < 0 ? this.dashboardItems.length : customIndex, 0, bpm)
        localStorage.setItem(KEY, JSON.stringify(this.tempos))
        localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.dashboardItems))
      }
      if (!isBuiltInTempo(bpm)) {
        this.pitches[bpm] = pitch
        localStorage.setItem(PITCH_KEY, JSON.stringify(this.pitches))
      }
    },
    remove(bpm: number) {
      this.tempos = this.tempos.filter(value => value !== bpm)
      this.dashboardItems = this.dashboardItems.filter(value => value !== bpm)
      delete this.pitches[bpm]
      localStorage.setItem(KEY, JSON.stringify(this.tempos))
      localStorage.setItem(PITCH_KEY, JSON.stringify(this.pitches))
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.dashboardItems))
    },
    removeFromDashboard(bpm: number) {
      if (isBuiltInTempo(bpm)) {
        this.dashboardItems = this.dashboardItems.filter(value => value !== bpm)
        localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.dashboardItems))
      } else this.remove(bpm)
    },
    restoreBuiltIn(bpm: number) {
      if (!isBuiltInTempo(bpm) || this.dashboardItems.includes(bpm)) return
      const customIndex = this.dashboardItems.indexOf(CUSTOM_TILE)
      this.dashboardItems.splice(customIndex < 0 ? this.dashboardItems.length : customIndex, 0, bpm)
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.dashboardItems))
    },
    moveDashboard(bpm: number, direction: -1 | 1) {
      this.moveDashboardItem(bpm, direction)
    },
    moveDashboardItem(item: DashboardItem, direction: -1 | 1) {
      const from = this.dashboardItems.indexOf(item)
      const to = from + direction
      if (from === -1 || to < 0 || to >= this.dashboardItems.length) return
      const reordered = [...this.dashboardItems]
      const [movedItem] = reordered.splice(from, 1)
      reordered.splice(to, 0, movedItem)
      this.dashboardItems = reordered
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.dashboardItems))
    },
    moveDashboardTo(bpm: number, targetBpm: number) {
      const from = this.dashboardItems.indexOf(bpm)
      const to = this.dashboardItems.indexOf(targetBpm)
      if (from === -1 || to === -1 || from === to) return
      const reordered = [...this.dashboardItems]
      const [tempo] = reordered.splice(from, 1)
      reordered.splice(to, 0, tempo)
      this.dashboardItems = reordered
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.dashboardItems))
    },
    move(bpm: number, direction: -1 | 1) {
      const from = this.tempos.indexOf(bpm)
      const to = from + direction
      if (from === -1 || to < 0 || to >= this.tempos.length) return
      const reordered = [...this.tempos]
      const [tempo] = reordered.splice(from, 1)
      reordered.splice(to, 0, tempo)
      this.tempos = reordered
      localStorage.setItem(KEY, JSON.stringify(this.tempos))
    },
    moveTo(bpm: number, targetBpm: number) {
      const from = this.tempos.indexOf(bpm)
      const to = this.tempos.indexOf(targetBpm)
      if (from === -1 || to === -1 || from === to) return
      const reordered = [...this.tempos]
      const [tempo] = reordered.splice(from, 1)
      reordered.splice(to, 0, tempo)
      this.tempos = reordered
      localStorage.setItem(KEY, JSON.stringify(this.tempos))
    },
  },
})
