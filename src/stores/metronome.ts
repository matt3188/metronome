import { defineStore } from 'pinia'
import { metronomeService } from '../services/metronome'

export const useMetronomeStore = defineStore('metronome', {
  state: () => ({ bpm: 100, isPlaying: false, beat: 0 }),
  actions: {
    async toggle(bpm = this.bpm) {
      if (this.isPlaying && this.bpm === bpm) return this.stop()
      this.bpm = bpm
      await metronomeService.start(bpm, beat => { this.beat = beat })
      this.isPlaying = true
    },
    setTempo(bpm: number) {
      this.bpm = Math.min(240, Math.max(30, Math.round(bpm)))
      if (this.isPlaying) metronomeService.setTempo(this.bpm)
    },
    stop() {
      metronomeService.stop()
      this.isPlaying = false
    },
  },
})
