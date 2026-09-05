import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import * as notificationPreferencesService from './notificationPreferencesService'
import { NotificationPreferencesPage } from './NotificationPreferencesPage'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./notificationPreferencesService', async () => {
  const actual = await vi.importActual<typeof import('./notificationPreferencesService')>(
    './notificationPreferencesService',
  )
  return { ...actual, getReminderHours: vi.fn(), setReminderHours: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedGetReminderHours = vi.mocked(notificationPreferencesService.getReminderHours)
const mockedSetReminderHours = vi.mocked(notificationPreferencesService.setReminderHours)

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { access_token: 't' } as never,
    user: { id: 'user-1' } as never,
    loading: false,
  })
})

describe('NotificationPreferencesPage', () => {
  it('muestra 3 horas por defecto cuando el usuario nunca configuro nada', async () => {
    mockedGetReminderHours.mockResolvedValue(3)
    render(<NotificationPreferencesPage />)

    expect(await screen.findByDisplayValue('3')).toBeInTheDocument()
  })

  it('guarda la preferencia cuando el valor es valido', async () => {
    mockedGetReminderHours.mockResolvedValue(3)
    mockedSetReminderHours.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<NotificationPreferencesPage />)

    const input = await screen.findByLabelText('Anticipación del recordatorio (horas)')
    await user.clear(input)
    await user.type(input, '6')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(mockedSetReminderHours).toHaveBeenCalledWith('user-1', 6)
    expect(await screen.findByText('Preferencia guardada')).toBeInTheDocument()
  })

  it('muestra un error de validacion cuando el valor no es valido', async () => {
    mockedGetReminderHours.mockResolvedValue(3)
    mockedSetReminderHours.mockRejectedValue(
      new notificationPreferencesService.InvalidReminderHoursError(),
    )
    const user = userEvent.setup()
    render(<NotificationPreferencesPage />)

    const input = await screen.findByLabelText('Anticipación del recordatorio (horas)')
    await user.clear(input)
    await user.type(input, '0')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(
      await screen.findByText('La anticipación debe ser mayor a 0 y menor o igual a 48 horas'),
    ).toBeInTheDocument()
  })

  it('muestra un error generico cuando falla el guardado', async () => {
    mockedGetReminderHours.mockResolvedValue(3)
    mockedSetReminderHours.mockRejectedValue(new Error('permission denied'))
    const user = userEvent.setup()
    render(<NotificationPreferencesPage />)

    const input = await screen.findByLabelText('Anticipación del recordatorio (horas)')
    await user.clear(input)
    await user.type(input, '6')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('permission denied')).toBeInTheDocument()
  })
})
