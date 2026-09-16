import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import * as tournamentsService from '../tournaments/tournamentsService'
import { StandingsPage } from './StandingsPage'
import * as standingsService from './standingsService'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./standingsService', async () => {
  const actual =
    await vi.importActual<typeof import('./standingsService')>('./standingsService')
  return { ...actual, getGroupTournamentStandings: vi.fn() }
})

vi.mock('../tournaments/tournamentsService', async () => {
  const actual =
    await vi.importActual<typeof import('../tournaments/tournamentsService')>(
      '../tournaments/tournamentsService',
    )
  return { ...actual, listTournamentStages: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedGetStandings = vi.mocked(standingsService.getGroupTournamentStandings)
const mockedListTournamentStages = vi.mocked(tournamentsService.listTournamentStages)

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { access_token: 't' } as never,
    user: { id: 'user-1' } as never,
    loading: false,
  })
  mockedListTournamentStages.mockResolvedValue([
    { id: 'stage-1', tournamentId: 'tournament-1', name: 'Apertura', orderIndex: 0 },
  ])
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/groups/group-1/tournaments/tournament-1/standings']}>
      <Routes>
        <Route
          path="/groups/:groupId/tournaments/:tournamentId/standings"
          element={<StandingsPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StandingsPage', () => {
  it('muestra a los miembros ordenados de mayor a menor puntaje, en tabla', async () => {
    mockedGetStandings.mockResolvedValue([
      { userId: 'user-2', displayName: 'Aldo', totalPoints: 6, rank: 1 },
      { userId: 'user-1', displayName: 'Doti', totalPoints: 4, rank: 2 },
    ])
    renderPage()

    expect(mockedGetStandings).toHaveBeenCalledWith('group-1', 'tournament-1')
    await screen.findByText('Aldo')
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Aldo')
    expect(rows[1]).toHaveTextContent('6 pts')
    expect(rows[2]).toHaveTextContent('Doti')
    expect(rows[2]).toHaveTextContent('4 pts')
  })

  it('muestra el mismo puesto para miembros empatados', async () => {
    mockedGetStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 5, rank: 1 },
      { userId: 'user-2', displayName: 'Aldo', totalPoints: 5, rank: 1 },
      { userId: 'user-3', displayName: 'Vieja', totalPoints: 2, rank: 3 },
    ])
    renderPage()

    await screen.findByText('Vieja')
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('1°')
    expect(rows[2]).toHaveTextContent('1°')
    expect(rows[3]).toHaveTextContent('3°')
  })

  it('muestra un tab por cada etapa del torneo, con General activo', async () => {
    mockedGetStandings.mockResolvedValue([])
    renderPage()

    expect(await screen.findByRole('link', { name: 'Apertura' })).toHaveAttribute(
      'href',
      '/groups/group-1/stages/stage-1/standings',
    )
    expect(screen.getByRole('link', { name: 'General' })).toHaveClass('active')
  })
})
