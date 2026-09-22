import type { Router } from 'vue-router'

type GtagCommand =
  | [command: 'js', loadedAt: Date]
  | [command: 'config' | 'event', target: string, parameters: Record<string, unknown>]

declare global {
  interface Window {
    dataLayer?: GtagCommand[]
    gtag?: (...args: GtagCommand) => void
  }
}

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/
let analyticsMeasurementId: string | undefined

export type UsageEvent =
  | 'metronome_started'
  | 'metronome_stopped'
  | 'pitch_changed'
  | 'preset_saved'

export function trackUsage(event: UsageEvent, parameters: Record<string, string | number> = {}) {
  if (!analyticsMeasurementId) return

  window.gtag?.('event', event, {
    ...parameters,
    send_to: analyticsMeasurementId,
  })
}

export function initializeAnalytics(
  router: Router,
  measurementId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
) {
  if (!measurementId || !MEASUREMENT_ID_PATTERN.test(measurementId)) return

  analyticsMeasurementId = measurementId
  window.dataLayer = window.dataLayer ?? []
  window.gtag = (...args: GtagCommand) => window.dataLayer?.push(args)
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.append(script)

  router.afterEach((to) => {
    window.gtag?.('event', 'page_view', {
      page_location: window.location.href,
      page_path: to.fullPath,
      page_title: document.title,
      send_to: measurementId,
    })
  })
}
