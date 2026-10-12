import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import {
  DEFAULT_REMINDER_HOURS,
  getReminderHours,
  InvalidReminderHoursError,
  setReminderHours,
} from './notificationPreferencesService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockedFrom = vi.mocked(supabase.from)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getReminderHours', () => {
  it('devuelve la preferencia guardada del usuario', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { reminder_hours_before: 6 },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    const hours = await getReminderHours('user-1')

    expect(mockedFrom).toHaveBeenCalledWith('notification_preferences')
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(hours).toBe(6)
  })

  it('devuelve 3 horas por defecto cuando el usuario nunca configuro nada', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    const hours = await getReminderHours('user-1')

    expect(hours).toBe(DEFAULT_REMINDER_HOURS)
    expect(DEFAULT_REMINDER_HOURS).toBe(3)
  })

  it('propaga el error cuando falla la consulta', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(getReminderHours('user-1')).rejects.toThrow('permission denied')
  })
})

describe('setReminderHours', () => {
  it('guarda la preferencia cuando el valor es valido', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    mockedFrom.mockReturnValue({ upsert } as never)

    await setReminderHours('user-1', 6)

    expect(mockedFrom).toHaveBeenCalledWith('notification_preferences')
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', reminder_hours_before: 6 },
      { onConflict: 'user_id' },
    )
  })

  it.each([0, -1, 49])(
    'lanza InvalidReminderHoursError sin llamar a supabase para %i horas',
    async (hours) => {
      await expect(setReminderHours('user-1', hours)).rejects.toThrow(InvalidReminderHoursError)
      expect(mockedFrom).not.toHaveBeenCalled()
    },
  )

  it('propaga el error cuando falla el guardado', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'permission denied' } })
    mockedFrom.mockReturnValue({ upsert } as never)

    await expect(setReminderHours('user-1', 6)).rejects.toThrow('permission denied')
  })
})
