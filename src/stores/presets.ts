import { defineStore } from 'pinia'
import { BUILT_IN_TEMPOS, isBuiltInTempo } from '../constants/tempos'

const CUSTOM_KEY = 'metronome-presets'
const LAYOUT_KEY = 'metronome-tempo-layout'
type Layout = { order: number[]; hiddenPresets: number[] }

const validTempo = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 30 && Number(value) <= 240
const readJson = (key: string): unknown => {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null }
}
const loadCustom = () => {
  const saved = readJson(CUSTOM_KEY)
  return Array.isArray(saved)
    ? [...new Set(saved.filter((value): value is number => validTempo(value) && !isBuiltInTempo(value)))]
    : []
}
const loadLayout = (): Layout => {
  const saved = readJson(LAYOUT_KEY)
  if (!saved || typeof saved !== 'object') return { order: [], hiddenPresets: [] }
  const candidate = saved as Partial<Layout>
  return {
    order: Array.isArray(candidate.order) ? [...new Set(candidate.order.filter(validTempo))] : [],
    hiddenPresets: Array.isArray(candidate.hiddenPresets) ? [...new Set(candidate.hiddenPresets.filter(isBuiltInTempo))] : [],
  }
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
    const tempos = loadCustom()
    const layout = loadLayout()
    const visible = [...BUILT_IN_TEMPOS.filter(bpm => !layout.hiddenPresets.includes(bpm)), ...tempos]
    return {
      tempos,
      hiddenPresets: layout.hiddenPresets,
      order: [...layout.order.filter(bpm => visible.includes(bpm)), ...visible.filter(bpm => !layout.order.includes(bpm))],
    }
  },
  getters: {
    visibleTempos: state => state.order,
    availablePresets: state => BUILT_IN_TEMPOS.filter(bpm => state.hiddenPresets.includes(bpm)),
  },
  actions: {
    persist() {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(this.tempos))
      localStorage.setItem(LAYOUT_KEY, JSON.stringify({ order: this.order, hiddenPresets: this.hiddenPresets }))
    },
    add(bpm: number) {
      if (!isBuiltInTempo(bpm) && !this.tempos.includes(bpm)) {
        this.tempos.push(bpm)
        this.order.push(bpm)
        this.persist()
      }
    },
    remove(bpm: number) {
      this.order = this.order.filter(value => value !== bpm)
      if (isBuiltInTempo(bpm)) this.hiddenPresets.push(bpm)
      else this.tempos = this.tempos.filter(value => value !== bpm)
      this.persist()
    },
    restorePreset(bpm: number) {
      if (!isBuiltInTempo(bpm) || !this.hiddenPresets.includes(bpm)) return
      this.hiddenPresets = this.hiddenPresets.filter(value => value !== bpm)
      this.order.push(bpm)
      this.persist()
    },
    move(bpm: number, direction: -1 | 1) {
      this.moveTo(bpm, this.order.indexOf(bpm) + direction)
    },
    moveTo(bpm: number, to: number) {
      const from = this.order.indexOf(bpm)
      if (from === -1 || to < 0 || to >= this.order.length || from === to) return
      const reordered = [...this.order]
      const [tempo] = reordered.splice(from, 1)
      reordered.splice(to, 0, tempo)
      this.order = reordered
      this.tempos = reordered.filter(bpm => !isBuiltInTempo(bpm))
      this.persist()
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
