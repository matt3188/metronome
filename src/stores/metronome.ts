import { defineStore } from 'pinia'
import { metronomeService } from '../services/metronome'

let endTimer: ReturnType<typeof setTimeout> | undefined

export const useMetronomeStore = defineStore('metronome', {
  state: () => ({ bpm: 100, isPlaying: false, beat: 0, sessionMinutes: 0 }),
  actions: {
    async toggle(bpm = this.bpm) {
      if (this.isPlaying && this.bpm === bpm) return this.stop()
      this.bpm = bpm
      await metronomeService.start(bpm, beat => { this.beat = beat })
      this.isPlaying = true
      if (endTimer) clearTimeout(endTimer)
      if (this.sessionMinutes > 0) endTimer = setTimeout(() => this.stop(), this.sessionMinutes * 60_000)
    },
    setTempo(bpm: number) {
      this.bpm = Math.min(240, Math.max(30, Math.round(bpm)))
      if (this.isPlaying) metronomeService.setTempo(this.bpm)
    },
    stop() {
      metronomeService.stop()
      this.isPlaying = false
      if (endTimer) clearTimeout(endTimer)
      endTimer = undefined
    },
  },
})
