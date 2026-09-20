import type { Router } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeAnalytics } from './analytics'

describe('Google Analytics', () => {
  beforeEach(() => {
    vi.resetModules()
    document.head.innerHTML = ''
    window.dataLayer = undefined
    window.gtag = undefined
  })

  it('does nothing when no measurement ID is configured', () => {
    const router = { afterEach: vi.fn() } as unknown as Router

    initializeAnalytics(router, '')

    expect(router.afterEach).not.toHaveBeenCalled()
    expect(document.head.querySelector('script')).toBeNull()
    expect(window.dataLayer).toBeUndefined()
  })

  it('loads gtag and records route changes as page views', () => {
    let afterEach: ((to: { fullPath: string }) => void) | undefined
    const router = {
      afterEach: vi.fn((callback) => {
        afterEach = callback
      }),
    } as unknown as Router

    initializeAnalytics(router, 'G-TEST123')
    afterEach?.({ fullPath: '/custom?bpm=120' })

    const script = document.head.querySelector('script')
    expect(script?.async).toBe(true)
    expect(script?.src).toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST123')
    expect(window.dataLayer).toEqual([
      ['js', expect.any(Date)],
      ['config', 'G-TEST123', { send_page_view: false }],
      [
        'event',
        'page_view',
        expect.objectContaining({ page_path: '/custom?bpm=120', send_to: 'G-TEST123' }),
      ],
    ])
  })

  it('records product usage events after analytics is initialized', async () => {
    const { initializeAnalytics: initialize, trackUsage } = await import('./analytics')
    const router = { afterEach: vi.fn() } as unknown as Router

    initialize(router, 'G-TEST123')
    trackUsage('metronome_started', { bpm: 120, pitch: 'high' })

    expect(window.dataLayer?.at(-1)).toEqual([
      'event',
      'metronome_started',
      { bpm: 120, pitch: 'high', send_to: 'G-TEST123' },
    ])
  })
})
