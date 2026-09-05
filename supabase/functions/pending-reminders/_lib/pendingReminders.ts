export interface UserReminderTarget {
  userId: string
  reminderHours: number
}

export interface PushSubscriptionInfo {
  endpoint: string
  p256dh: string
  authKey: string
}

export interface PushPayload {
  title: string
  body: string
}

export interface ReminderClient {
  listUsersToRemind(): Promise<UserReminderTarget[]>
  countPendingPredictions(userId: string, withinHours: number): Promise<number>
  getPushSubscriptions(userId: string): Promise<PushSubscriptionInfo[]>
  sendPush(subscription: PushSubscriptionInfo, payload: PushPayload): Promise<void>
}

function buildReminderMessage(pendingCount: number): PushPayload {
  return {
    title: 'Pronósticos pendientes',
    body:
      pendingCount === 1
        ? 'Tenés 1 pronóstico pendiente antes del cierre'
        : `Tenés ${pendingCount} pronósticos pendientes antes del cierre`,
  }
}

export async function sendPendingReminders(client: ReminderClient): Promise<void> {
  const targets = await client.listUsersToRemind()

  for (const target of targets) {
    const pendingCount = await client.countPendingPredictions(target.userId, target.reminderHours)
    if (pendingCount === 0) continue

    const subscriptions = await client.getPushSubscriptions(target.userId)
    const payload = buildReminderMessage(pendingCount)

    for (const subscription of subscriptions) {
      await client.sendPush(subscription, payload)
    }
  }
}
