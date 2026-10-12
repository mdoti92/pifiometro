import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'
import { sendPendingReminders, type ReminderClient } from './_lib/pendingReminders.ts'

const DEFAULT_REMINDER_HOURS = 3

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

  webpush.setVapidDetails('mailto:soporte@pifiometro.app', vapidPublicKey, vapidPrivateKey)

  const admin = createClient(supabaseUrl, serviceRoleKey, { db: { schema: 'pifiometro' } })

  const client: ReminderClient = {
    async listUsersToRemind() {
      const { data: subscriptions, error: subscriptionsError } = await admin
        .from('push_subscriptions')
        .select('user_id')
      if (subscriptionsError) throw new Error(subscriptionsError.message)

      const userIds = [...new Set(subscriptions.map((row) => row.user_id))]
      if (userIds.length === 0) return []

      const { data: preferences, error: preferencesError } = await admin
        .from('notification_preferences')
        .select('user_id, reminder_hours_before')
        .in('user_id', userIds)
      if (preferencesError) throw new Error(preferencesError.message)

      const preferenceByUser = new Map(preferences.map((row) => [row.user_id, row.reminder_hours_before]))

      return userIds.map((userId) => ({
        userId,
        reminderHours: preferenceByUser.get(userId) ?? DEFAULT_REMINDER_HOURS,
      }))
    },

    async countPendingPredictions(userId, withinHours) {
      const { data, error } = await admin.rpc('count_pending_predictions', {
        p_user_id: userId,
        p_within_hours: withinHours,
      })
      if (error) throw new Error(error.message)
      return data as number
    },

    async getPushSubscriptions(userId) {
      const { data, error } = await admin
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth_key')
        .eq('user_id', userId)
      if (error) throw new Error(error.message)
      return data.map((row) => ({ endpoint: row.endpoint, p256dh: row.p256dh, authKey: row.auth_key }))
    },

    async sendPush(subscription, payload) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.authKey },
          },
          JSON.stringify(payload),
        )
      } catch (err) {
        console.error(`No se pudo enviar push a ${subscription.endpoint}:`, err)
      }
    },
  }

  try {
    await sendPendingReminders(client)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
