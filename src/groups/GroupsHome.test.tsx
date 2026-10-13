import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import { GroupsHome } from './GroupsHome'
import * as groupTournamentsService from './groupTournamentsService'
import * as groupsService from './groupsService'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./groupsService', async () => {
  const actual = await vi.importActual<typeof import('./groupsService')>('./groupsService')
  return { ...actual, listMyGroups: vi.fn() }
})

vi.mock('./groupTournamentsService', async () => {
  const actual =
    await vi.importActual<typeof import('./groupTournamentsService')>('./groupTournamentsService')
  return { ...actual, listGroupTournaments: vi.fn() }
})

vi.mock('../notifications/usePushSubscriptionPrompt', () => ({
  usePushSubscriptionPrompt: vi.fn(),
}))

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedListMyGroups = vi.mocked(groupsService.listMyGroups)
const mockedListGroupTournaments = vi.mocked(groupTournamentsService.listGroupTournaments)

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockedUseAuth.mockReturnValue({
    session: { access_token: 't' } as never,
    user: { id: 'user-1' } as never,
    loading: false,
  })
})

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<GroupsHome />} />
        <Route path="/groups/:groupId/tournaments" element={<p>Torneos del grupo</p>} />
        <Route
          path="/groups/:groupId/tournaments/:tournamentId/standings"
          element={<p>Tabla del torneo</p>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GroupsHome', () => {
  it('redirige a la tabla del torneo vigente cuando el grupo tiene uno solo activo', async () => {
    mockedListMyGroups.mockResolvedValue([{ id: 'group-1', name: 'LBDH' }])
    mockedListGroupTournaments.mockResolvedValue([
      { tournamentId: 'tournament-1', name: 'Liga AUF', season: '2026', active: true },
    ])
    renderHome()

    expect(await screen.findByText('Tabla del torneo')).toBeInTheDocument()
    expect(mockedListGroupTournaments).toHaveBeenCalledWith('group-1')
  })

  it('usa el grupo activo guardado para elegir la tabla', async () => {
    localStorage.setItem('pifiometro.activeGroupId', 'group-2')
    mockedListMyGroups.mockResolvedValue([
      { id: 'group-1', name: 'LBDH' },
      { id: 'group-2', name: 'Otro' },
    ])
    mockedListGroupTournaments.mockResolvedValue([
      { tournamentId: 'tournament-1', name: 'Liga AUF', season: '2026', active: true },
    ])
    renderHome()

    expect(await screen.findByText('Tabla del torneo')).toBeInTheDocument()
    expect(mockedListGroupTournaments).toHaveBeenCalledWith('group-2')
  })

  it('redirige a los torneos del grupo cuando no hay un único torneo activo', async () => {
    mockedListMyGroups.mockResolvedValue([{ id: 'group-1', name: 'LBDH' }])
    mockedListGroupTournaments.mockResolvedValue([])
    renderHome()

    expect(await screen.findByText('Torneos del grupo')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Crear grupo' })).not.toBeInTheDocument()
  })

  it('muestra crear/unirse a un grupo cuando el usuario no pertenece a ninguno', async () => {
    mockedListMyGroups.mockResolvedValue([])
    renderHome()

    expect(await screen.findByRole('heading', { name: 'Crear grupo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Unirme a un grupo' })).toBeInTheDocument()
  })
})
