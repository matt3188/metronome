export type BeatListener = (beat: number) => void
export type MetronomePitch = 'high' | 'low'

const PITCH_FREQUENCIES: Record<MetronomePitch, { accented: number; regular: number }> = {
  high: { accented: 1100, regular: 820 },
  low: { accented: 620, regular: 440 },
}

const LOOK_AHEAD_MS = 25
const SCHEDULE_AHEAD_SECONDS = 0.1

export class MetronomeService {
  private context?: AudioContext
  private timer?: ReturnType<typeof setInterval>
  private nextBeatAt = 0
  private beat = 0
  private bpm = 100
  private pitch: MetronomePitch = 'high'
  private listener?: BeatListener
  private generation = 0

  get playing() { return this.timer !== undefined }

  async start(bpm: number, pitch: MetronomePitch = 'high', listener?: BeatListener) {
    this.stop()
    this.bpm = bpm
    this.pitch = pitch
    this.listener = listener
    const generation = ++this.generation
    this.context ??= new AudioContext()
    await this.context.resume()
    this.nextBeatAt = this.context.currentTime + 0.04
    this.beat = 0
    this.schedule(generation)
    this.timer = setInterval(() => this.schedule(generation), LOOK_AHEAD_MS)
  }

  setTempo(bpm: number) { this.bpm = bpm }

  setPitch(pitch: MetronomePitch) { this.pitch = pitch }

  async preview(pitch: MetronomePitch) {
    this.context ??= new AudioContext()
    await this.context.resume()
    this.pitch = pitch
    this.click(this.context.currentTime + 0.01, true)
  }

  stop() {
    if (this.timer !== undefined) clearInterval(this.timer)
    this.timer = undefined
    this.listener = undefined
    this.generation++
  }

  private schedule(generation: number) {
    if (!this.context || generation !== this.generation) return
    while (this.nextBeatAt < this.context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const beat = this.beat++
      this.click(this.nextBeatAt, beat % 4 === 0)
      const delay = Math.max(0, (this.nextBeatAt - this.context.currentTime) * 1000)
      setTimeout(() => {
        if (generation === this.generation) this.listener?.(beat)
      }, delay)
      this.nextBeatAt += 60 / this.bpm
    }
  }

  private click(time: number, accented: boolean) {
    if (!this.context) return
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    const frequencies = PITCH_FREQUENCIES[this.pitch]
    oscillator.frequency.value = accented ? frequencies.accented : frequencies.regular
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(accented ? 0.28 : 0.2, time + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045)
    oscillator.connect(gain).connect(this.context.destination)
    oscillator.start(time)
    oscillator.stop(time + 0.05)
  }
}

export const metronomeService = new MetronomeService()
