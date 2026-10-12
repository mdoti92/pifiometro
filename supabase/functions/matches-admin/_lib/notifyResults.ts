export interface PredictionPointsSnapshot {
  userId: string
  points: number
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

export interface NotifyResultsClient {
  getPredictionsSnapshot(matchId: string): Promise<PredictionPointsSnapshot[]>
  getPushSubscriptions(userId: string): Promise<PushSubscriptionInfo[]>
  sendPush(subscription: PushSubscriptionInfo, payload: PushPayload): Promise<void>
}

export async function notifyResultChanges(
  client: NotifyResultsClient,
  matchId: string,
  before: PredictionPointsSnapshot[],
): Promise<void> {
  const after = await client.getPredictionsSnapshot(matchId)
  const previousPointsByUser = new Map(before.map((prediction) => [prediction.userId, prediction.points]))

  for (const prediction of after) {
    if (previousPointsByUser.get(prediction.userId) === prediction.points) continue

    const subscriptions = await client.getPushSubscriptions(prediction.userId)
    const payload: PushPayload = {
      title: 'Resultado cargado',
      body: `Sumaste ${prediction.points} punto${prediction.points === 1 ? '' : 's'} en tu pronóstico`,
    }

    for (const subscription of subscriptions) {
      await client.sendPush(subscription, payload)
    }
  }
}
