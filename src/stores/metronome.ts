import { defineStore } from 'pinia'
import { metronomeService } from '../services/metronome'
import type { MetronomePitch } from '../services/metronome'

export const useMetronomeStore = defineStore('metronome', {
  state: () => ({ bpm: 100, pitch: 'high' as MetronomePitch, isPlaying: false, beat: 0 }),
  actions: {
    async toggle(bpm = this.bpm, pitch: MetronomePitch = this.pitch) {
      if (this.isPlaying && this.bpm === bpm && this.pitch === pitch) return this.stop()
      this.bpm = bpm
      this.pitch = pitch
      await metronomeService.start(bpm, pitch, beat => { this.beat = beat })
      this.isPlaying = true
    },
    setTempo(bpm: number) {
      this.bpm = Math.min(240, Math.max(30, Math.round(bpm)))
      if (this.isPlaying) metronomeService.setTempo(this.bpm)
    },
    setPitch(pitch: MetronomePitch) {
      this.pitch = pitch
      if (this.isPlaying) metronomeService.setPitch(pitch)
    },
    select(bpm: number, pitch: MetronomePitch = this.pitch) {
      this.setTempo(bpm)
      this.setPitch(pitch)
    },
    togglePitch() {
      this.setPitch(this.pitch === 'high' ? 'low' : 'high')
    },
    previewPitch(pitch: MetronomePitch = this.pitch) {
      this.setPitch(pitch)
      return metronomeService.preview(pitch)
    },
    stop() {
      metronomeService.stop()
      this.isPlaying = false
    },
  },
})
