import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  return { ...actual, getGroupTournamentStandings: vi.fn(), getGroupStageStandings: vi.fn() }
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
const mockedGetStageStandings = vi.mocked(standingsService.getGroupStageStandings)
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
    { id: 'stage-2', tournamentId: 'tournament-1', name: 'Intermedio', orderIndex: 1 },
  ])
  mockedGetStageStandings.mockResolvedValue([])
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
    const general = await screen.findByRole('region', { name: 'General' })
    await within(general).findByText('Aldo')
    const rows = within(general).getAllByRole('row')
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

    const general = await screen.findByRole('region', { name: 'General' })
    await within(general).findByText('Vieja')
    const rows = within(general).getAllByRole('row')
    expect(rows[1]).toHaveTextContent('1°')
    expect(rows[2]).toHaveTextContent('1°')
    expect(rows[3]).toHaveTextContent('3°')
  })

  it('muestra la tabla general arriba y debajo una tabla por etapa en orden', async () => {
    mockedGetStandings.mockResolvedValue([])
    mockedGetStageStandings.mockImplementation(async (_groupId, stageId) =>
      stageId === 'stage-1'
        ? [{ userId: 'user-2', displayName: 'Aldo', totalPoints: 3, rank: 1 }]
        : [{ userId: 'user-1', displayName: 'Doti', totalPoints: 1, rank: 1 }],
    )
    renderPage()

    await screen.findByRole('region', { name: 'Intermedio' })
    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings).toEqual(['General', 'Apertura', 'Intermedio'])
    expect(mockedGetStageStandings).toHaveBeenCalledWith('group-1', 'stage-1')
    expect(mockedGetStageStandings).toHaveBeenCalledWith('group-1', 'stage-2')
    expect(await within(screen.getByRole('region', { name: 'Apertura' })).findByText('Aldo')).toBeInTheDocument()
    expect(await within(screen.getByRole('region', { name: 'Intermedio' })).findByText('Doti')).toBeInTheDocument()
  })

  it('muestra un switch por tabla, todos prendidos de entrada', async () => {
    mockedGetStandings.mockResolvedValue([])
    renderPage()

    await screen.findByRole('button', { name: 'Intermedio' })
    for (const name of ['General', 'Apertura', 'Intermedio']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
    }
  })

  it('oculta la tabla al apagar su switch y la vuelve a mostrar al prenderlo', async () => {
    mockedGetStandings.mockResolvedValue([])
    const user = userEvent.setup()
    renderPage()

    const aperturaSwitch = await screen.findByRole('button', { name: 'Apertura' })
    await user.click(aperturaSwitch)

    expect(aperturaSwitch).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('region', { name: 'Apertura' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'General' })).toBeInTheDocument()

    await user.click(aperturaSwitch)

    expect(aperturaSwitch).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('region', { name: 'Apertura' })).toBeInTheDocument()
  })
})
