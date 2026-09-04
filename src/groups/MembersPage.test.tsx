import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import * as groupMembersService from './groupMembersService'
import { MembersPage } from './MembersPage'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./groupMembersService', async () => {
  const actual =
    await vi.importActual<typeof import('./groupMembersService')>('./groupMembersService')
  return {
    ...actual,
    isGroupAdmin: vi.fn(),
    listMembers: vi.fn(),
    removeMember: vi.fn(),
    regenerateInviteCode: vi.fn(),
  }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedIsGroupAdmin = vi.mocked(groupMembersService.isGroupAdmin)
const mockedListMembers = vi.mocked(groupMembersService.listMembers)
const mockedRemoveMember = vi.mocked(groupMembersService.removeMember)
const mockedRegenerateInviteCode = vi.mocked(groupMembersService.regenerateInviteCode)

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { access_token: 't' } as never,
    user: { id: 'user-1' } as never,
    loading: false,
  })
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/groups/group-1/members']}>
      <Routes>
        <Route path="/groups/:groupId/members" element={<MembersPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MembersPage', () => {
  it('deniega el acceso cuando el usuario no es admin del grupo', async () => {
    mockedIsGroupAdmin.mockResolvedValue(false)
    renderPage()

    expect(
      await screen.findByText('No tenés permisos para administrar este grupo'),
    ).toBeInTheDocument()
    expect(mockedListMembers).not.toHaveBeenCalled()
  })

  it('lista los miembros del grupo cuando el usuario es admin', async () => {
    mockedIsGroupAdmin.mockResolvedValue(true)
    mockedListMembers.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01T00:00:00Z' },
      { userId: 'user-2', displayName: 'Aldo', role: 'member', joinedAt: '2026-01-02T00:00:00Z' },
    ])
    renderPage()

    expect(await screen.findByText('Doti')).toBeInTheDocument()
    expect(screen.getByText('Aldo')).toBeInTheDocument()
  })

  it('expulsa a un miembro y lo saca de la lista', async () => {
    mockedIsGroupAdmin.mockResolvedValue(true)
    mockedListMembers.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01T00:00:00Z' },
      { userId: 'user-2', displayName: 'Aldo', role: 'member', joinedAt: '2026-01-02T00:00:00Z' },
    ])
    mockedRemoveMember.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Aldo')
    await user.click(screen.getByRole('button', { name: 'Expulsar a Aldo' }))

    expect(mockedRemoveMember).toHaveBeenCalledWith('group-1', 'user-2')
    await waitFor(() => expect(screen.queryByText('Aldo')).not.toBeInTheDocument())
  })

  it('muestra un error cuando falla la expulsion', async () => {
    mockedIsGroupAdmin.mockResolvedValue(true)
    mockedListMembers.mockResolvedValue([
      { userId: 'user-2', displayName: 'Aldo', role: 'member', joinedAt: '2026-01-02T00:00:00Z' },
    ])
    mockedRemoveMember.mockRejectedValue(new Error('permission denied'))
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Aldo')
    await user.click(screen.getByRole('button', { name: 'Expulsar a Aldo' }))

    expect(await screen.findByText('permission denied')).toBeInTheDocument()
    expect(screen.getByText('Aldo')).toBeInTheDocument()
  })

  it('regenera el codigo de invitacion y lo muestra', async () => {
    mockedIsGroupAdmin.mockResolvedValue(true)
    mockedListMembers.mockResolvedValue([])
    mockedRegenerateInviteCode.mockResolvedValue('ZZ99YY')
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Regenerar código' }))

    expect(mockedRegenerateInviteCode).toHaveBeenCalledWith('group-1')
    expect(await screen.findByText(/ZZ99YY/)).toBeInTheDocument()
  })

  it('muestra un error cuando falla la regeneracion del codigo', async () => {
    mockedIsGroupAdmin.mockResolvedValue(true)
    mockedListMembers.mockResolvedValue([])
    mockedRegenerateInviteCode.mockRejectedValue(
      new Error('Solo el admin del grupo puede regenerar el codigo'),
    )
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Regenerar código' }))

    expect(
      await screen.findByText('Solo el admin del grupo puede regenerar el codigo'),
    ).toBeInTheDocument()
  })
})
