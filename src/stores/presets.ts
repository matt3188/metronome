import { defineStore } from 'pinia'

const KEY = 'metronome-presets'
const load = (): number[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(saved)
      ? [...new Set(saved.filter((value): value is number => Number.isInteger(value) && value >= 30 && value <= 240 && ![50, 100].includes(value)))]
      : []
  } catch { return [] }
}

export const usePresetsStore = defineStore('presets', {
  state: () => ({ tempos: load() }),
  actions: {
    add(bpm: number) {
      if (![50, 100].includes(bpm) && !this.tempos.includes(bpm)) {
        this.tempos.push(bpm)
        localStorage.setItem(KEY, JSON.stringify(this.tempos))
      }
    },
    remove(bpm: number) {
      this.tempos = this.tempos.filter(value => value !== bpm)
      localStorage.setItem(KEY, JSON.stringify(this.tempos))
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
  },
})
