import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { metronomeService } from '../services/metronome'
import { useMetronomeStore } from './metronome'

vi.mock('../services/metronome', () => ({
  metronomeService: {
    start: vi.fn().mockResolvedValue(undefined),
    setTempo: vi.fn(),
    stop: vi.fn(),
  },
}))

describe('metronome store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('keeps every tempo playing until it is paused', async () => {
    const store = useMetronomeStore()

    await store.toggle(120)

    expect(store.isPlaying).toBe(true)
    expect(store.bpm).toBe(120)
    expect(metronomeService.start).toHaveBeenCalledWith(120, expect.any(Function))
    expect(metronomeService.stop).not.toHaveBeenCalled()

    await store.toggle(120)

    expect(store.isPlaying).toBe(false)
    expect(metronomeService.stop).toHaveBeenCalledOnce()
  })
})
