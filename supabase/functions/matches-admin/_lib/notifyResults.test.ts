import { beforeEach, describe, expect, it, vi } from 'vitest'
import { notifyResultChanges, type NotifyResultsClient } from './notifyResults'

function createFakeClient(overrides: Partial<NotifyResultsClient> = {}): NotifyResultsClient {
  return {
    getPredictionsSnapshot: vi.fn().mockResolvedValue([]),
    getPushSubscriptions: vi.fn().mockResolvedValue([]),
    sendPush: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('notifyResultChanges', () => {
  it('notifica a cada usuario que pronostico con los puntos que obtuvo', async () => {
    const subscription = { endpoint: 'https://push.example.com/a', p256dh: 'p', authKey: 'a' }
    const client = createFakeClient({
      getPredictionsSnapshot: vi.fn().mockResolvedValue([{ userId: 'user-1', points: 3 }]),
      getPushSubscriptions: vi.fn().mockResolvedValue([subscription]),
    })

    await notifyResultChanges(client, 'match-1', [{ userId: 'user-1', points: 0 }])

    expect(client.sendPush).toHaveBeenCalledWith(subscription, {
      title: 'Resultado cargado',
      body: 'Sumaste 3 puntos en tu pronóstico',
    })
  })

  it('no notifica a un usuario que no pronostico ese partido', async () => {
    const client = createFakeClient({
      getPredictionsSnapshot: vi.fn().mockResolvedValue([]),
    })

    await notifyResultChanges(client, 'match-1', [])

    expect(client.getPushSubscriptions).not.toHaveBeenCalled()
    expect(client.sendPush).not.toHaveBeenCalled()
  })

  it('no vuelve a notificar cuando el puntaje no cambio respecto de la corridas anterior', async () => {
    const client = createFakeClient({
      getPredictionsSnapshot: vi.fn().mockResolvedValue([{ userId: 'user-1', points: 3 }]),
    })

    await notifyResultChanges(client, 'match-1', [{ userId: 'user-1', points: 3 }])

    expect(client.getPushSubscriptions).not.toHaveBeenCalled()
    expect(client.sendPush).not.toHaveBeenCalled()
  })

  it('notifica de nuevo con el puntaje actualizado cuando una correccion cambia los puntos', async () => {
    const subscription = { endpoint: 'https://push.example.com/a', p256dh: 'p', authKey: 'a' }
    const client = createFakeClient({
      getPredictionsSnapshot: vi.fn().mockResolvedValue([{ userId: 'user-1', points: 0 }]),
      getPushSubscriptions: vi.fn().mockResolvedValue([subscription]),
    })

    await notifyResultChanges(client, 'match-1', [{ userId: 'user-1', points: 1 }])

    expect(client.sendPush).toHaveBeenCalledWith(
      subscription,
      expect.objectContaining({ body: 'Sumaste 0 puntos en tu pronóstico' }),
    )
  })

  it('no falla cuando el usuario no tiene suscripcion push activa', async () => {
    const client = createFakeClient({
      getPredictionsSnapshot: vi.fn().mockResolvedValue([{ userId: 'user-1', points: 3 }]),
      getPushSubscriptions: vi.fn().mockResolvedValue([]),
    })

    await expect(
      notifyResultChanges(client, 'match-1', [{ userId: 'user-1', points: 0 }]),
    ).resolves.toBeUndefined()
    expect(client.sendPush).not.toHaveBeenCalled()
  })
})
