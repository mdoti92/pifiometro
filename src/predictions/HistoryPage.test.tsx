import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import { HistoryPage } from './HistoryPage'
import * as historyService from './historyService'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./historyService', async () => {
  const actual = await vi.importActual<typeof import('./historyService')>('./historyService')
  return { ...actual, getMatchHistory: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedGetMatchHistory = vi.mocked(historyService.getMatchHistory)

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
    <MemoryRouter initialEntries={['/groups/group-1/tournaments/tournament-1/history']}>
      <Routes>
        <Route
          path="/groups/:groupId/tournaments/:tournamentId/history"
          element={<HistoryPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HistoryPage', () => {
  it('muestra mi pronostico, el resultado real y el estado de cada partido', async () => {
    mockedGetMatchHistory.mockResolvedValue([
      {
        matchId: 'match-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        homeTeamSlug: 'nacional',
        awayTeamSlug: 'penarol',
        kickoffAt: '2000-01-01T20:00:00Z',
        predictedHomeGoals: 2,
        predictedAwayGoals: 1,
        actualHomeGoals: 2,
        actualAwayGoals: 1,
        status: 'exacto',
      },
    ])
    renderPage()

    expect(mockedGetMatchHistory).toHaveBeenCalledWith('tournament-1', 'group-1', 'user-1')
    const row = await screen.findByText(/Nacional vs Peñarol/)
    expect(row).toHaveTextContent('Mi pronóstico: 2-1')
    expect(row).toHaveTextContent('Resultado: 2-1')
    expect(row).toHaveTextContent('Exacto')
  })

  it('muestra Por definir para un partido aun no jugado', async () => {
    mockedGetMatchHistory.mockResolvedValue([
      {
        matchId: 'match-3',
        homeTeam: 'Cerro',
        awayTeam: 'Liverpool',
        homeTeamSlug: 'cerro',
        awayTeamSlug: 'liverpool',
        kickoffAt: '2999-01-01T20:00:00Z',
        predictedHomeGoals: null,
        predictedAwayGoals: null,
        actualHomeGoals: null,
        actualAwayGoals: null,
        status: 'por_definir',
      },
    ])
    renderPage()

    expect(await screen.findByText(/Por definir/)).toBeInTheDocument()
  })
})
