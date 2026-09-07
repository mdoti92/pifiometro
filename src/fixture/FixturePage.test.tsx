import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as groupTournamentsService from '../groups/groupTournamentsService'
import { FixturePage } from './FixturePage'
import * as fixtureService from './fixtureService'

vi.mock('../groups/groupTournamentsService', async () => {
  const actual = await vi.importActual<typeof import('../groups/groupTournamentsService')>(
    '../groups/groupTournamentsService',
  )
  return { ...actual, listGroupTournaments: vi.fn() }
})

vi.mock('./fixtureService', async () => {
  const actual = await vi.importActual<typeof import('./fixtureService')>('./fixtureService')
  return { ...actual, listTournamentFixture: vi.fn() }
})

const mockedListGroupTournaments = vi.mocked(groupTournamentsService.listGroupTournaments)
const mockedListTournamentFixture = vi.mocked(fixtureService.listTournamentFixture)

beforeEach(() => {
  vi.clearAllMocks()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/groups/group-1/fixture']}>
      <Routes>
        <Route path="/groups/:groupId/fixture" element={<FixturePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FixturePage', () => {
  it('agrupa los partidos del torneo activo por matchday, en orden cronologico', async () => {
    mockedListGroupTournaments.mockResolvedValue([
      { tournamentId: 'tournament-1', name: 'Liga AUF 2026', season: '2026', active: true },
    ])
    mockedListTournamentFixture.mockResolvedValue([
      {
        id: 'match-2',
        homeTeam: 'Danubio',
        awayTeam: 'Wanderers',
        homeTeamSlug: 'danubio',
        awayTeamSlug: 'wanderers',
        kickoffAt: '2026-03-08T20:00:00Z',
        matchday: 2,
        status: 'scheduled',
        homeGoals: null,
        awayGoals: null,
        isElimination: false,
        wentToPenalties: false,
        homeGoalsPenalties: null,
        awayGoalsPenalties: null,
      },
      {
        id: 'match-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        homeTeamSlug: 'nacional',
        awayTeamSlug: 'penarol',
        kickoffAt: '2026-03-01T20:00:00Z',
        matchday: 1,
        status: 'finished',
        homeGoals: 2,
        awayGoals: 1,
        isElimination: false,
        wentToPenalties: false,
        homeGoalsPenalties: null,
        awayGoalsPenalties: null,
      },
    ])
    renderPage()

    expect(await screen.findByText('Fecha 1')).toBeInTheDocument()
    expect(screen.getByText('Fecha 2')).toBeInTheDocument()
    expect(mockedListTournamentFixture).toHaveBeenCalledWith('tournament-1')

    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings[0]).toHaveTextContent('Fecha 1')
    expect(headings[1]).toHaveTextContent('Fecha 2')
  })

  it('muestra el logo de cada equipo junto al partido', async () => {
    mockedListGroupTournaments.mockResolvedValue([
      { tournamentId: 'tournament-1', name: 'Liga AUF 2026', season: '2026', active: true },
    ])
    mockedListTournamentFixture.mockResolvedValue([
      {
        id: 'match-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        homeTeamSlug: 'nacional',
        awayTeamSlug: 'penarol',
        kickoffAt: '2026-03-01T20:00:00Z',
        matchday: 1,
        status: 'finished',
        homeGoals: 2,
        awayGoals: 1,
        isElimination: false,
        wentToPenalties: false,
        homeGoalsPenalties: null,
        awayGoalsPenalties: null,
      },
    ])
    renderPage()

    expect(await screen.findByRole('img', { name: 'Nacional' })).toHaveAttribute(
      'src',
      '/team-logos/nacional.svg',
    )
    expect(screen.getByRole('img', { name: 'Peñarol' })).toHaveAttribute(
      'src',
      '/team-logos/penarol.svg',
    )
  })

  it('muestra el resultado final de un partido jugado', async () => {
    mockedListGroupTournaments.mockResolvedValue([
      { tournamentId: 'tournament-1', name: 'Liga AUF 2026', season: '2026', active: true },
    ])
    mockedListTournamentFixture.mockResolvedValue([
      {
        id: 'match-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        homeTeamSlug: 'nacional',
        awayTeamSlug: 'penarol',
        kickoffAt: '2026-03-01T20:00:00Z',
        matchday: 1,
        status: 'finished',
        homeGoals: 2,
        awayGoals: 1,
        isElimination: false,
        wentToPenalties: false,
        homeGoalsPenalties: null,
        awayGoalsPenalties: null,
      },
    ])
    renderPage()

    expect(await screen.findByText(/Nacional vs Peñarol — 2-1/)).toBeInTheDocument()
  })

  it('distingue el resultado de los 90 minutos del resultado por penales en un eliminatorio', async () => {
    mockedListGroupTournaments.mockResolvedValue([
      { tournamentId: 'tournament-1', name: 'Liga AUF 2026', season: '2026', active: true },
    ])
    mockedListTournamentFixture.mockResolvedValue([
      {
        id: 'match-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        homeTeamSlug: 'nacional',
        awayTeamSlug: 'penarol',
        kickoffAt: '2026-03-01T20:00:00Z',
        matchday: null,
        status: 'finished',
        homeGoals: 1,
        awayGoals: 1,
        isElimination: true,
        wentToPenalties: true,
        homeGoalsPenalties: 4,
        awayGoalsPenalties: 3,
      },
    ])
    renderPage()

    expect(await screen.findByText(/Nacional vs Peñarol — 1-1 \(penales 4-3\)/)).toBeInTheDocument()
  })

  it('deja elegir el torneo a ver cuando el grupo sigue mas de uno activo', async () => {
    mockedListGroupTournaments.mockResolvedValue([
      { tournamentId: 'tournament-1', name: 'Liga AUF 2026', season: '2026', active: true },
      { tournamentId: 'tournament-2', name: 'Copa AUF', season: '2026', active: true },
    ])
    mockedListTournamentFixture.mockResolvedValue([])
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(mockedListTournamentFixture).toHaveBeenCalledWith('tournament-1'))

    await user.selectOptions(screen.getByLabelText('Torneo'), 'tournament-2')

    await waitFor(() => expect(mockedListTournamentFixture).toHaveBeenCalledWith('tournament-2'))
  })

  it('no muestra selector ni pide elegir torneo cuando el grupo sigue solo uno', async () => {
    mockedListGroupTournaments.mockResolvedValue([
      { tournamentId: 'tournament-1', name: 'Liga AUF 2026', season: '2026', active: true },
    ])
    mockedListTournamentFixture.mockResolvedValue([])
    renderPage()

    await waitFor(() => expect(mockedListTournamentFixture).toHaveBeenCalledWith('tournament-1'))
    expect(screen.queryByLabelText('Torneo')).not.toBeInTheDocument()
  })

  it('muestra un estado vacio cuando el grupo no sigue ningun torneo activo', async () => {
    mockedListGroupTournaments.mockResolvedValue([
      { tournamentId: 'tournament-1', name: 'Liga vieja', season: '2025', active: false },
    ])
    renderPage()

    expect(await screen.findByText('Tu grupo no sigue ningún torneo activo todavía')).toBeInTheDocument()
    expect(mockedListTournamentFixture).not.toHaveBeenCalled()
  })
})
