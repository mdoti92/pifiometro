import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as pushSubscriptionService from './pushSubscriptionService'
import { usePushSubscriptionPrompt } from './usePushSubscriptionPrompt'

vi.mock('./pushSubscriptionService', async () => {
  const actual =
    await vi.importActual<typeof import('./pushSubscriptionService')>('./pushSubscriptionService')
  return { ...actual, subscribeToPush: vi.fn() }
})

const mockedSubscribeToPush = vi.mocked(pushSubscriptionService.subscribeToPush)
const originalServiceWorker = navigator.serviceWorker

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: originalServiceWorker,
  })
})

function stubPushSupport(permission: NotificationPermission) {
  vi.stubGlobal('Notification', { permission })
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {},
  })
}

describe('usePushSubscriptionPrompt', () => {
  it('no hace nada si no hay usuario logueado', () => {
    stubPushSupport('default')

    renderHook(() => usePushSubscriptionPrompt(undefined))

    expect(mockedSubscribeToPush).not.toHaveBeenCalled()
  })

  it('no hace nada si el navegador no soporta push (sin Notification/serviceWorker)', () => {
    renderHook(() => usePushSubscriptionPrompt('user-1'))

    expect(mockedSubscribeToPush).not.toHaveBeenCalled()
  })

  it('no vuelve a pedir permiso si ya fue concedido o rechazado antes', () => {
    stubPushSupport('granted')

    renderHook(() => usePushSubscriptionPrompt('user-1'))

    expect(mockedSubscribeToPush).not.toHaveBeenCalled()
  })

  it('pide suscribirse a push cuando el permiso todavia no fue decidido', async () => {
    stubPushSupport('default')
    mockedSubscribeToPush.mockResolvedValue(true)

    renderHook(() => usePushSubscriptionPrompt('user-1'))

    await waitFor(() => expect(mockedSubscribeToPush).toHaveBeenCalledWith('user-1'))
  })

  it('no rompe la app si falla la suscripcion a push', async () => {
    stubPushSupport('default')
    mockedSubscribeToPush.mockRejectedValue(new Error('boom'))

    expect(() => renderHook(() => usePushSubscriptionPrompt('user-1'))).not.toThrow()
    await waitFor(() => expect(mockedSubscribeToPush).toHaveBeenCalled())
  })
})
