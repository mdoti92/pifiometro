import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendPendingReminders, type ReminderClient } from './pendingReminders'

function createFakeClient(overrides: Partial<ReminderClient> = {}): ReminderClient {
  return {
    listUsersToRemind: vi.fn().mockResolvedValue([]),
    countPendingPredictions: vi.fn().mockResolvedValue(0),
    getPushSubscriptions: vi.fn().mockResolvedValue([]),
    sendPush: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('sendPendingReminders', () => {
  it('envia un push con la cantidad de pronosticos pendientes a cada suscripcion del usuario', async () => {
    const subscription = { endpoint: 'https://push.example.com/a', p256dh: 'p', authKey: 'a' }
    const client = createFakeClient({
      listUsersToRemind: vi.fn().mockResolvedValue([{ userId: 'user-1', reminderHours: 3 }]),
      countPendingPredictions: vi.fn().mockResolvedValue(2),
      getPushSubscriptions: vi.fn().mockResolvedValue([subscription]),
    })

    await sendPendingReminders(client)

    expect(client.countPendingPredictions).toHaveBeenCalledWith('user-1', 3)
    expect(client.sendPush).toHaveBeenCalledWith(subscription, {
      title: 'Pronósticos pendientes',
      body: 'Tenés 2 pronósticos pendientes antes del cierre',
    })
  })

  it('no envia nada cuando el usuario no tiene pronosticos pendientes', async () => {
    const client = createFakeClient({
      listUsersToRemind: vi.fn().mockResolvedValue([{ userId: 'user-1', reminderHours: 3 }]),
      countPendingPredictions: vi.fn().mockResolvedValue(0),
    })

    await sendPendingReminders(client)

    expect(client.getPushSubscriptions).not.toHaveBeenCalled()
    expect(client.sendPush).not.toHaveBeenCalled()
  })

  it('no falla ni intenta enviar cuando el usuario no tiene suscripcion push activa', async () => {
    const client = createFakeClient({
      listUsersToRemind: vi.fn().mockResolvedValue([{ userId: 'user-1', reminderHours: 3 }]),
      countPendingPredictions: vi.fn().mockResolvedValue(2),
      getPushSubscriptions: vi.fn().mockResolvedValue([]),
    })

    await expect(sendPendingReminders(client)).resolves.toBeUndefined()
    expect(client.sendPush).not.toHaveBeenCalled()
  })

  it('usa el singular cuando hay un solo pronostico pendiente', async () => {
    const subscription = { endpoint: 'https://push.example.com/a', p256dh: 'p', authKey: 'a' }
    const client = createFakeClient({
      listUsersToRemind: vi.fn().mockResolvedValue([{ userId: 'user-1', reminderHours: 3 }]),
      countPendingPredictions: vi.fn().mockResolvedValue(1),
      getPushSubscriptions: vi.fn().mockResolvedValue([subscription]),
    })

    await sendPendingReminders(client)

    expect(client.sendPush).toHaveBeenCalledWith(
      subscription,
      expect.objectContaining({ body: 'Tenés 1 pronóstico pendiente antes del cierre' }),
    )
  })

  it('usa el default de 3 horas cuando el usuario no configuro preferencia (lo resuelve listUsersToRemind)', async () => {
    const client = createFakeClient({
      listUsersToRemind: vi.fn().mockResolvedValue([{ userId: 'user-1', reminderHours: 3 }]),
    })

    await sendPendingReminders(client)

    expect(client.countPendingPredictions).toHaveBeenCalledWith('user-1', 3)
  })
})
