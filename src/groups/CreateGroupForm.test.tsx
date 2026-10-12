import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import { CreateGroupForm } from './CreateGroupForm'
import * as groupsService from './groupsService'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./groupsService', async () => {
  const actual = await vi.importActual<typeof import('./groupsService')>('./groupsService')
  return { ...actual, createGroup: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedCreateGroup = vi.mocked(groupsService.createGroup)

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { access_token: 't' } as never,
    user: { id: 'user-1' } as never,
    loading: false,
  })
})

describe('CreateGroupForm', () => {
  it('muestra un error de validacion cuando el nombre esta vacio, sin llamar a createGroup', async () => {
    const user = userEvent.setup()
    render(<CreateGroupForm />)

    await user.click(screen.getByRole('button', { name: 'Crear grupo' }))

    expect(await screen.findByText('El nombre del grupo es obligatorio')).toBeInTheDocument()
    expect(mockedCreateGroup).not.toHaveBeenCalled()
  })

  it('crea el grupo con el usuario logueado como creador y muestra el codigo de invitacion', async () => {
    mockedCreateGroup.mockResolvedValue({
      id: 'group-1',
      name: 'Los pibes',
      inviteCode: 'AB12CD',
      createdBy: 'user-1',
      createdAt: '2026-01-01T00:00:00Z',
    })
    const user = userEvent.setup()
    render(<CreateGroupForm />)

    await user.type(screen.getByLabelText('Nombre del grupo'), 'Los pibes')
    await user.click(screen.getByRole('button', { name: 'Crear grupo' }))

    expect(mockedCreateGroup).toHaveBeenCalledWith('Los pibes', 'user-1')
    expect(await screen.findByText(/AB12CD/)).toBeInTheDocument()
  })

  it('muestra un error cuando falla la creacion del grupo', async () => {
    mockedCreateGroup.mockRejectedValue(new Error('permission denied'))
    const user = userEvent.setup()
    render(<CreateGroupForm />)

    await user.type(screen.getByLabelText('Nombre del grupo'), 'Los pibes')
    await user.click(screen.getByRole('button', { name: 'Crear grupo' }))

    expect(await screen.findByText('permission denied')).toBeInTheDocument()
  })
})
