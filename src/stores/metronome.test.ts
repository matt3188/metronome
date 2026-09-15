import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { metronomeService } from '../services/metronome'
import { useMetronomeStore } from './metronome'

vi.mock('../services/metronome', () => ({
  metronomeService: {
    start: vi.fn().mockResolvedValue(undefined),
    setTempo: vi.fn(),
    setPitch: vi.fn(),
    preview: vi.fn().mockResolvedValue(undefined),
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
    expect(metronomeService.start).toHaveBeenCalledWith(120, 'high', expect.any(Function))
    expect(metronomeService.stop).not.toHaveBeenCalled()

    await store.toggle(120)

    expect(store.isPlaying).toBe(false)
    expect(metronomeService.stop).toHaveBeenCalledOnce()
  })

  it('changes and previews the selected pitch', async () => {
    const store = useMetronomeStore()
    store.setPitch('low')
    await store.previewPitch()

    expect(store.pitch).toBe('low')
    expect(metronomeService.preview).toHaveBeenCalledWith('low')
  })

  it('changes the pitch of a metronome that is already playing', async () => {
    const store = useMetronomeStore()
    await store.toggle(120)

    store.togglePitch()

    expect(store.pitch).toBe('low')
    expect(store.isPlaying).toBe(true)
    expect(metronomeService.setPitch).toHaveBeenCalledWith('low')
    expect(metronomeService.start).toHaveBeenCalledOnce()
  })

  it('selects a tempo and updates the current sound without stopping playback', async () => {
    const store = useMetronomeStore()
    await store.toggle(100)

    store.select(80, 'low')

    expect(store.bpm).toBe(80)
    expect(store.pitch).toBe('low')
    expect(store.isPlaying).toBe(true)
    expect(metronomeService.setTempo).toHaveBeenCalledWith(80)
    expect(metronomeService.setPitch).toHaveBeenCalledWith('low')
    expect(metronomeService.start).toHaveBeenCalledOnce()
  })
})
