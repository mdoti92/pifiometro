import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import * as tournamentsService from '../tournaments/tournamentsService'
import { StageStandingsPage } from './StageStandingsPage'
import * as standingsService from './standingsService'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./standingsService', async () => {
  const actual =
    await vi.importActual<typeof import('./standingsService')>('./standingsService')
  return { ...actual, getGroupStageStandings: vi.fn() }
})

vi.mock('../tournaments/tournamentsService', async () => {
  const actual =
    await vi.importActual<typeof import('../tournaments/tournamentsService')>(
      '../tournaments/tournamentsService',
    )
  return { ...actual, getStage: vi.fn(), listTournamentStages: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedGetStageStandings = vi.mocked(standingsService.getGroupStageStandings)
const mockedGetStage = vi.mocked(tournamentsService.getStage)
const mockedListTournamentStages = vi.mocked(tournamentsService.listTournamentStages)

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { access_token: 't' } as never,
    user: { id: 'user-1' } as never,
    loading: false,
  })
  mockedGetStage.mockResolvedValue({
    id: 'stage-1',
    tournamentId: 'tournament-1',
    name: 'Apertura',
    orderIndex: 0,
  })
  mockedListTournamentStages.mockResolvedValue([
    { id: 'stage-1', tournamentId: 'tournament-1', name: 'Apertura', orderIndex: 0 },
    { id: 'stage-2', tournamentId: 'tournament-1', name: 'Clausura', orderIndex: 1 },
  ])
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/groups/group-1/stages/stage-1/standings']}>
      <Routes>
        <Route path="/groups/:groupId/stages/:stageId/standings" element={<StageStandingsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StageStandingsPage', () => {
  it('muestra la tabla de puntos limitada a la etapa seleccionada', async () => {
    mockedGetStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 3, rank: 1 },
    ])
    renderPage()

    expect(mockedGetStageStandings).toHaveBeenCalledWith('group-1', 'stage-1')
    expect(await screen.findByText(/Doti/)).toBeInTheDocument()
  })

  it('muestra la tabla sin error cuando la etapa no tiene partidos jugados', async () => {
    mockedGetStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 0, rank: 1 },
    ])
    renderPage()

    expect(await screen.findByText(/0 pts/)).toBeInTheDocument()
  })

  it('muestra tabs con General y las etapas hermanas, marcando la actual como activa', async () => {
    mockedGetStageStandings.mockResolvedValue([])
    renderPage()

    expect(await screen.findByRole('link', { name: 'Apertura' })).toHaveClass('active')
    expect(screen.getByRole('link', { name: 'Clausura' })).toHaveAttribute(
      'href',
      '/groups/group-1/stages/stage-2/standings',
    )
    expect(screen.getByRole('link', { name: 'General' })).toHaveAttribute(
      'href',
      '/groups/group-1/tournaments/tournament-1/standings',
    )
  })
})
