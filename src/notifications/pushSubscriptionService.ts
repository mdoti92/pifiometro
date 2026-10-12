import { supabase } from '../lib/supabase'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }

  return output
}

export async function subscribeToPush(userId: string): Promise<boolean> {
  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    return false
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  })

  const json = subscription.toJSON()

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth_key: json.keys?.auth,
    },
    { onConflict: 'endpoint' },
  )

  if (error) {
    throw new Error(error.message)
  }

  return true
}
