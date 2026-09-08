import { defineStore } from 'pinia'

const KEY = 'metronome-presets'
const load = (): number[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(saved)
      ? [...new Set(saved.filter((value): value is number => Number.isInteger(value) && value >= 30 && value <= 240 && ![50, 100].includes(value)))].sort((a, b) => a - b)
      : []
  } catch { return [] }
}

export const usePresetsStore = defineStore('presets', {
  state: () => ({ tempos: load() }),
  actions: {
    add(bpm: number) {
      if (![50, 100].includes(bpm) && !this.tempos.includes(bpm)) {
        this.tempos.push(bpm)
        this.tempos.sort((a, b) => a - b)
        localStorage.setItem(KEY, JSON.stringify(this.tempos))
      }
    },
    remove(bpm: number) {
      this.tempos = this.tempos.filter(value => value !== bpm)
      localStorage.setItem(KEY, JSON.stringify(this.tempos))
    },
  },
})
