import { defineStore } from 'pinia'
import { isBuiltInTempo } from '../constants/tempos'
import type { MetronomePitch } from '../services/metronome'

const KEY = 'metronome-presets'
const PITCH_KEY = 'metronome-preset-pitches'
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

export const usePresetsStore = defineStore('presets', {
  state: () => ({ tempos: load(), pitches: loadPitches() }),
  actions: {
    add(bpm: number, pitch: MetronomePitch = 'high') {
      if (!isBuiltInTempo(bpm) && !this.tempos.includes(bpm)) {
        this.tempos.push(bpm)
        localStorage.setItem(KEY, JSON.stringify(this.tempos))
      }
      if (!isBuiltInTempo(bpm)) {
        this.pitches[bpm] = pitch
        localStorage.setItem(PITCH_KEY, JSON.stringify(this.pitches))
      }
    },
    remove(bpm: number) {
      this.tempos = this.tempos.filter(value => value !== bpm)
      delete this.pitches[bpm]
      localStorage.setItem(KEY, JSON.stringify(this.tempos))
      localStorage.setItem(PITCH_KEY, JSON.stringify(this.pitches))
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
