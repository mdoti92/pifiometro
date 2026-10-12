import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { subscribeToPush } from './pushSubscriptionService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockedFrom = vi.mocked(supabase.from)

const requestPermission = vi.fn()
const subscribe = vi.fn()
const originalNotification = globalThis.Notification
const originalServiceWorker = navigator.serviceWorker

beforeEach(() => {
  vi.clearAllMocks()

  vi.stubGlobal('Notification', { requestPermission })
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      ready: Promise.resolve({ pushManager: { subscribe } }),
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: originalServiceWorker,
  })
  globalThis.Notification = originalNotification
})

describe('subscribeToPush', () => {
  it('devuelve false sin suscribirse cuando se rechaza el permiso', async () => {
    requestPermission.mockResolvedValue('denied')

    const result = await subscribeToPush('user-1')

    expect(result).toBe(false)
    expect(subscribe).not.toHaveBeenCalled()
    expect(mockedFrom).not.toHaveBeenCalled()
  })

  it('guarda la suscripcion asociada al usuario cuando se acepta el permiso', async () => {
    requestPermission.mockResolvedValue('granted')
    subscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: 'https://push.example.com/abc',
        keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
      }),
    })
    const upsert = vi.fn().mockResolvedValue({ error: null })
    mockedFrom.mockReturnValue({ upsert } as never)

    const result = await subscribeToPush('user-1')

    expect(result).toBe(true)
    expect(mockedFrom).toHaveBeenCalledWith('push_subscriptions')
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        endpoint: 'https://push.example.com/abc',
        p256dh: 'p256dh-key',
        auth_key: 'auth-key',
      },
      { onConflict: 'endpoint' },
    )
  })

  it('propaga el error cuando falla al guardar la suscripcion', async () => {
    requestPermission.mockResolvedValue('granted')
    subscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: 'https://push.example.com/abc',
        keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
      }),
    })
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'permission denied' } })
    mockedFrom.mockReturnValue({ upsert } as never)

    await expect(subscribeToPush('user-1')).rejects.toThrow('permission denied')
  })
})
