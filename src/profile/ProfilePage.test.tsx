import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import * as authService from '../auth/authService'
import * as groupMembersService from '../groups/groupMembersService'
import * as groupsService from '../groups/groupsService'
import * as tournamentsService from '../tournaments/tournamentsService'
import { ProfilePage } from './ProfilePage'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('../auth/authService', async () => {
  const actual = await vi.importActual<typeof import('../auth/authService')>('../auth/authService')
  return { ...actual, signOut: vi.fn() }
})

vi.mock('../tournaments/tournamentsService', async () => {
  const actual = await vi.importActual<typeof import('../tournaments/tournamentsService')>(
    '../tournaments/tournamentsService',
  )
  return { ...actual, isSuperadmin: vi.fn() }
})

vi.mock('../groups/groupsService', async () => {
  const actual = await vi.importActual<typeof import('../groups/groupsService')>('../groups/groupsService')
  return { ...actual, listMyGroups: vi.fn() }
})

vi.mock('../groups/groupMembersService', async () => {
  const actual =
    await vi.importActual<typeof import('../groups/groupMembersService')>('../groups/groupMembersService')
  return { ...actual, isGroupAdmin: vi.fn() }
})

const mockedListMyGroups = vi.mocked(groupsService.listMyGroups)
const mockedIsGroupAdmin = vi.mocked(groupMembersService.isGroupAdmin)
const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedIsSuperadmin = vi.mocked(tournamentsService.isSuperadmin)
const mockedSignOut = vi.mocked(authService.signOut)

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockedListMyGroups.mockResolvedValue([{ id: 'group-1', name: 'LBDH' }])
  mockedIsGroupAdmin.mockResolvedValue(false)
  mockedUseAuth.mockReturnValue({
    session: { access_token: 't' } as never,
    user: { id: 'user-1', email: 'martin@example.com' } as never,
    loading: false,
  })
})

function renderProfilePage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  )
}

describe('ProfilePage', () => {
  it('no muestra la seccion de administracion para un usuario comun', async () => {
    mockedIsSuperadmin.mockResolvedValue(false)
    renderProfilePage()

    expect(await screen.findByText('martin@example.com')).toBeInTheDocument()
    expect(screen.queryByText('Administración')).not.toBeInTheDocument()
  })

  it('muestra la seccion de administracion para un superadmin', async () => {
    mockedIsSuperadmin.mockResolvedValue(true)
    renderProfilePage()

    expect(await screen.findByText('Administración')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Torneos y etapas' })).toBeInTheDocument()
  })

  it('cierra sesion al tocar el boton', async () => {
    mockedIsSuperadmin.mockResolvedValue(false)
    const user = userEvent.setup()
    renderProfilePage()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(mockedSignOut).toHaveBeenCalled()
  })

  it('muestra el acceso al grupo activo cuando el usuario es admin del grupo', async () => {
    mockedIsSuperadmin.mockResolvedValue(false)
    mockedIsGroupAdmin.mockResolvedValue(true)
    renderProfilePage()

    expect(await screen.findByRole('link', { name: 'Grupo' })).toHaveAttribute('href', '/groups/group-1/members')
    expect(mockedIsGroupAdmin).toHaveBeenCalledWith('group-1')
  })

  it('no muestra el acceso al grupo cuando el usuario no es admin del grupo', async () => {
    mockedIsSuperadmin.mockResolvedValue(false)
    renderProfilePage()

    await screen.findByText('martin@example.com')
    await vi.waitFor(() => expect(mockedIsGroupAdmin).toHaveBeenCalled())
    expect(screen.queryByRole('link', { name: 'Grupo' })).not.toBeInTheDocument()
  })
})
