import { useEffect } from 'react'
import { subscribeToPush } from './pushSubscriptionService'

export function usePushSubscriptionPrompt(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (Notification.permission !== 'default') return

    // Un fallo al suscribirse a push no debe impedir el uso normal de la app.
    subscribeToPush(userId).catch(() => {})
  }, [userId])
}
