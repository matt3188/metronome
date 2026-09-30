const SERVICE_WORKER_URL = `${import.meta.env.BASE_URL}sw.js?v=${encodeURIComponent(__APP_BUILD_ID__)}`
const UPDATE_INTERVAL = 60 * 60 * 1000

const CHANGES = [
  'See what changed before installing an update.',
  'Receive new versions reliably after every deployment.',
] as const

export type PwaUpdate = {
  apply: () => void
  changes: readonly string[]
}

export function watchForPwaUpdates(onUpdate: (update: PwaUpdate) => void): () => void {
  if (!('serviceWorker' in navigator)) return () => undefined

  let registration: ServiceWorkerRegistration | undefined
  let interval: ReturnType<typeof setInterval> | undefined
  let reloading = false

  const reloadForNewWorker = () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  }

  const announceWaitingWorker = (waiting: ServiceWorker) => {
    onUpdate({
      apply: () => waiting.postMessage({ type: 'SKIP_WAITING' }),
      changes: CHANGES,
    })
  }

  const checkForUpdate = () => {
    if (registration && navigator.onLine) void registration.update()
  }

  navigator.serviceWorker.addEventListener('controllerchange', reloadForNewWorker)

  void navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: import.meta.env.BASE_URL })
    .then((newRegistration) => {
      registration = newRegistration

      if (registration.waiting) announceWaitingWorker(registration.waiting)
      registration.addEventListener('updatefound', () => {
        const worker = registration?.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            announceWaitingWorker(worker)
          }
        })
      })

      interval = setInterval(checkForUpdate, UPDATE_INTERVAL)
      document.addEventListener('visibilitychange', checkForUpdate)
    })
    .catch((error: unknown) => console.warn('Service worker registration failed.', error))

  return () => {
    navigator.serviceWorker.removeEventListener('controllerchange', reloadForNewWorker)
    document.removeEventListener('visibilitychange', checkForUpdate)
    if (interval) clearInterval(interval)
  }
}
