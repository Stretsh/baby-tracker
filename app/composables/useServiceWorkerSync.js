/**
 * Triggers service worker pull/push sync when the app is used or returns to foreground.
 * SW timers alone are unreliable; CHECK_SYNC is debounced in sw.js (2s).
 */
export const useServiceWorkerSync = () => {
  const postCheckSync = () => {
    if (!import.meta.client) return
    try {
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_SYNC' })
      }
    } catch (e) {
      console.log('postCheckSync failed:', e)
    }
  }

  const registerBackgroundSync = async (registration) => {
    if (!registration?.sync) return
    try {
      await registration.sync.register('baby-tracker-sync')
      console.log('Background sync registered (baby-tracker-sync)')
    } catch (e) {
      console.log('Background sync not available:', e?.message)
    }
  }

  const onBecameVisible = () => {
    if (document.visibilityState !== 'visible') return
    postCheckSync()
  }

  const onPageShow = (event) => {
    if (event.persisted) postCheckSync()
  }

  const setupServiceWorkerSyncTriggers = () => {
    if (!import.meta.client || !('serviceWorker' in navigator)) return

    document.addEventListener('visibilitychange', onBecameVisible)
    window.addEventListener('focus', onBecameVisible)
    window.addEventListener('pageshow', onPageShow)

    const onOnline = () => {
      navigator.serviceWorker.ready.then((registration) => {
        registerBackgroundSync(registration)
      })
    }
    window.addEventListener('online', onOnline)

    navigator.serviceWorker.ready.then((registration) => {
      postCheckSync()
      registerBackgroundSync(registration)
    })

    onUnmounted(() => {
      document.removeEventListener('visibilitychange', onBecameVisible)
      window.removeEventListener('focus', onBecameVisible)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('online', onOnline)
    })
  }

  return {
    setupServiceWorkerSyncTriggers,
    postCheckSync,
    registerBackgroundSync
  }
}
