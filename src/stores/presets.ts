import { defineStore } from 'pinia'
import { BUILT_IN_TEMPOS, isBuiltInTempo } from '../constants/tempos'
import type { MetronomePitch } from '../services/metronome'

const KEY = 'metronome-presets'
const PITCH_KEY = 'metronome-preset-pitches'
const DASHBOARD_KEY = 'metronome-dashboard-tempos'
const LABEL_KEY = 'metronome-preset-labels'
export type DashboardItem = number
const normalizeLabel = (label: string) => label.trim().slice(0, 40)
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
const loadLabels = (): Record<number, string> => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(LABEL_KEY) ?? '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return Object.fromEntries(Object.entries(saved)
      .filter(([bpm, label]) => Number.isInteger(Number(bpm)) && typeof label === 'string')
      .map(([bpm, label]) => [bpm, normalizeLabel(label as string)])
      .filter(([, label]) => label.length > 0))
  } catch { return {} }
}
const loadDashboard = (customTempos: number[]): DashboardItem[] => {
  const available = [...BUILT_IN_TEMPOS, ...customTempos]
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(DASHBOARD_KEY) ?? 'null')
    if (!Array.isArray(saved)) return available
    const ordered = [...new Set(saved.filter((value): value is DashboardItem => (
      Number.isInteger(value) && available.includes(value as number)
    )))]
    // A newly-created custom tempo should still appear even when a layout was
    // saved before it existed. Missing built-ins, however, remain intentionally hidden.
    const withNewTempos = [...ordered, ...customTempos.filter(tempo => !ordered.includes(tempo))]
    return withNewTempos
  } catch { return available }
}

export const usePresetsStore = defineStore('presets', {
  state: () => {
    const tempos = load()
    return { tempos, dashboardItems: loadDashboard(tempos), pitches: loadPitches(), labels: loadLabels() }
  },
  getters: {
    dashboardTempos: state => state.dashboardItems.filter((item): item is number => typeof item === 'number'),
    removedTempos: state => [...BUILT_IN_TEMPOS, ...state.tempos]
      .filter(tempo => !state.dashboardItems.includes(tempo)),
  },
  actions: {
    add(bpm: number, pitch: MetronomePitch = 'high', label = '') {
      if (!isBuiltInTempo(bpm) && !this.tempos.includes(bpm)) {
        this.tempos.push(bpm)
        this.dashboardItems.push(bpm)
        localStorage.setItem(KEY, JSON.stringify(this.tempos))
        localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.dashboardItems))
      }
      if (!isBuiltInTempo(bpm)) {
        this.pitches[bpm] = pitch
        localStorage.setItem(PITCH_KEY, JSON.stringify(this.pitches))
      }
      this.setLabel(bpm, label)
    },
    overwrite(previousBpm: number, bpm: number, pitch: MetronomePitch = 'high', label = this.labels[previousBpm] ?? '') {
      if (!this.dashboardItems.includes(previousBpm) || previousBpm === bpm) return

      const replaced = this.dashboardItems.map(value => value === previousBpm ? bpm : value)
      this.dashboardItems = replaced.filter((value, position) => replaced.indexOf(value) === position)

      if (!isBuiltInTempo(previousBpm)) {
        this.tempos = this.tempos.filter(value => value !== previousBpm)
        delete this.pitches[previousBpm]
      }
      if (previousBpm !== bpm) delete this.labels[previousBpm]
      if (!isBuiltInTempo(bpm) && !this.tempos.includes(bpm)) this.tempos.push(bpm)
      if (!isBuiltInTempo(bpm)) this.pitches[bpm] = pitch

      localStorage.setItem(KEY, JSON.stringify(this.tempos))
      localStorage.setItem(PITCH_KEY, JSON.stringify(this.pitches))
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.dashboardItems))
      this.setLabel(bpm, label)
    },
    remove(bpm: number) {
      this.tempos = this.tempos.filter(value => value !== bpm)
      this.dashboardItems = this.dashboardItems.filter(value => value !== bpm)
      delete this.pitches[bpm]
      delete this.labels[bpm]
      localStorage.setItem(KEY, JSON.stringify(this.tempos))
      localStorage.setItem(PITCH_KEY, JSON.stringify(this.pitches))
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.dashboardItems))
      localStorage.setItem(LABEL_KEY, JSON.stringify(this.labels))
    },
    setLabel(bpm: number, label: string) {
      const normalized = normalizeLabel(label)
      if (normalized) this.labels[bpm] = normalized
      else delete this.labels[bpm]
      localStorage.setItem(LABEL_KEY, JSON.stringify(this.labels))
    },
    removeFromDashboard(bpm: number) {
      this.dashboardItems = this.dashboardItems.filter(value => value !== bpm)
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.dashboardItems))
    },
    restoreTempo(bpm: number) {
      const exists = isBuiltInTempo(bpm) || this.tempos.includes(bpm)
      if (!exists || this.dashboardItems.includes(bpm)) return
      this.dashboardItems.push(bpm)
      localStorage.setItem(DASHBOARD_KEY, JSON.stringify(this.dashboardItems))
    },
    restoreBuiltIn(bpm: number) {
      this.restoreTempo(bpm)
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
    moveDashboardTo(item: DashboardItem, targetItem: DashboardItem) {
      const from = this.dashboardItems.indexOf(item)
      const to = this.dashboardItems.indexOf(targetItem)
      if (from === -1 || to === -1 || from === to) return
      const reordered = [...this.dashboardItems]
      ;[reordered[from], reordered[to]] = [reordered[to], reordered[from]]
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
