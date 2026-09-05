import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  DEFAULT_REMINDER_HOURS,
  getReminderHours,
  setReminderHours,
} from './notificationPreferencesService'

export function NotificationPreferencesPage() {
  const { user } = useAuth()
  const [hours, setHours] = useState(DEFAULT_REMINDER_HOURS)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    getReminderHours(user.id).then(setHours)
  }, [user])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    if (!user) return

    try {
      await setReminderHours(user.id, hours)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la preferencia')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Preferencias de notificaciones</h1>

      <label htmlFor="reminder-hours">Anticipación del recordatorio (horas)</label>
      <input
        id="reminder-hours"
        type="number"
        value={hours}
        onChange={(event) => setHours(Number(event.target.value))}
      />

      {error && <p role="alert">{error}</p>}
      {saved && <p>Preferencia guardada</p>}

      <button type="submit">Guardar</button>
    </form>
  )
}
