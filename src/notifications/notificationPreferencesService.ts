import { supabase } from '../lib/supabase'

export const DEFAULT_REMINDER_HOURS = 3
const MAX_REMINDER_HOURS = 48

export class InvalidReminderHoursError extends Error {
  constructor() {
    super(`La anticipación debe ser mayor a 0 y menor o igual a ${MAX_REMINDER_HOURS} horas`)
    this.name = 'InvalidReminderHoursError'
  }
}

export async function getReminderHours(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('reminder_hours_before')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? data.reminder_hours_before : DEFAULT_REMINDER_HOURS
}

export async function setReminderHours(userId: string, hours: number): Promise<void> {
  if (hours <= 0 || hours > MAX_REMINDER_HOURS) {
    throw new InvalidReminderHoursError()
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, reminder_hours_before: hours }, { onConflict: 'user_id' })

  if (error) {
    throw new Error(error.message)
  }
}
