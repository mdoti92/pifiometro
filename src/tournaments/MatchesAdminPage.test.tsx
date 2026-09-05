import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as matchesAdminService from './matchesAdminService'
import { MatchesAdminPage } from './MatchesAdminPage'
import * as tournamentsService from './tournamentsService'

vi.mock('./tournamentsService', async () => {
  const actual = await vi.importActual<typeof import('./tournamentsService')>('./tournamentsService')
  return { ...actual, isSuperadmin: vi.fn(), listTournamentStages: vi.fn() }
})

vi.mock('./matchesAdminService', async () => {
  const actual =
    await vi.importActual<typeof import('./matchesAdminService')>('./matchesAdminService')
  return { ...actual, listMatches: vi.fn(), createMatch: vi.fn(), editMatch: vi.fn() }
})

const mockedIsSuperadmin = vi.mocked(tournamentsService.isSuperadmin)
const mockedListTournamentStages = vi.mocked(tournamentsService.listTournamentStages)
const mockedListMatches = vi.mocked(matchesAdminService.listMatches)
const mockedCreateMatch = vi.mocked(matchesAdminService.createMatch)
const mockedEditMatch = vi.mocked(matchesAdminService.editMatch)

beforeEach(() => {
  vi.clearAllMocks()
  mockedListTournamentStages.mockResolvedValue([
    { id: 'stage-1', tournamentId: 'tournament-1', name: 'Apertura', orderIndex: 0 },
  ])
  mockedListMatches.mockResolvedValue([])
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/tournaments/tournament-1/matches']}>
      <Routes>
        <Route path="/admin/tournaments/:tournamentId/matches" element={<MatchesAdminPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MatchesAdminPage', () => {
  it('deniega el acceso cuando el usuario no es superadmin', async () => {
    mockedIsSuperadmin.mockResolvedValue(false)
    renderPage()

    expect(
      await screen.findByText('No tenés permisos para administrar partidos'),
    ).toBeInTheDocument()
    expect(mockedCreateMatch).not.toHaveBeenCalled()
  })

  it('carga un partido nuevo marcado como manual', async () => {
    mockedIsSuperadmin.mockResolvedValue(true)
    mockedCreateMatch.mockResolvedValue({
      id: 'match-1',
      tournamentId: 'tournament-1',
      stageId: 'stage-1',
      homeTeam: 'Nacional',
      awayTeam: 'Peñarol',
      kickoffAt: '2026-03-01T20:00',
      isElimination: false,
      source: 'manual',
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Local'), 'Nacional')
    await user.type(screen.getByLabelText('Visitante'), 'Peñarol')
    await user.type(screen.getByLabelText('Fecha y hora'), '2026-03-01T20:00')
    await user.click(screen.getByRole('button', { name: 'Cargar partido' }))

    expect(mockedCreateMatch).toHaveBeenCalledWith({
      tournamentId: 'tournament-1',
      stageId: 'stage-1',
      homeTeam: 'Nacional',
      awayTeam: 'Peñarol',
      kickoffAt: '2026-03-01T20:00',
      isElimination: false,
    })
    expect(
      await screen.findByRole('button', { name: 'Editar partido Nacional vs Peñarol' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Nacional vs Peñarol — manual/)).toBeInTheDocument()
  })

  it('muestra un error cuando falla la carga del partido', async () => {
    mockedIsSuperadmin.mockResolvedValue(true)
    mockedCreateMatch.mockRejectedValue(new Error('Solo un superadmin puede cargar o editar partidos'))
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Local'), 'Nacional')
    await user.type(screen.getByLabelText('Visitante'), 'Peñarol')
    await user.type(screen.getByLabelText('Fecha y hora'), '2026-03-01T20:00')
    await user.click(screen.getByRole('button', { name: 'Cargar partido' }))

    expect(
      await screen.findByText('Solo un superadmin puede cargar o editar partidos'),
    ).toBeInTheDocument()
  })

  it('edita un partido existente que vino de la API y lo pasa a manual', async () => {
    mockedIsSuperadmin.mockResolvedValue(true)
    mockedListMatches.mockResolvedValue([
      {
        id: 'match-1',
        tournamentId: 'tournament-1',
        stageId: 'stage-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        kickoffAt: '2026-03-01T20:00',
        isElimination: false,
        source: 'api',
      },
    ])
    mockedEditMatch.mockResolvedValue({
      id: 'match-1',
      tournamentId: 'tournament-1',
      stageId: 'stage-1',
      homeTeam: 'Nacional',
      awayTeam: 'Peñarol',
      kickoffAt: '2026-03-02T21:00',
      isElimination: false,
      source: 'manual',
    })
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Editar partido Nacional vs Peñarol' }))
    const kickoffInput = screen.getByLabelText('Fecha y hora (editar)')
    await user.clear(kickoffInput)
    await user.type(kickoffInput, '2026-03-02T21:00')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(mockedEditMatch).toHaveBeenCalledWith('match-1', {
      homeTeam: 'Nacional',
      awayTeam: 'Peñarol',
      kickoffAt: '2026-03-02T21:00',
      isElimination: false,
    })
    await waitFor(() => expect(screen.getAllByText(/manual/).length).toBeGreaterThan(0))
  })

  it('muestra un error cuando falla la edicion', async () => {
    mockedIsSuperadmin.mockResolvedValue(true)
    mockedListMatches.mockResolvedValue([
      {
        id: 'match-1',
        tournamentId: 'tournament-1',
        stageId: 'stage-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        kickoffAt: '2026-03-01T20:00',
        isElimination: false,
        source: 'api',
      },
    ])
    mockedEditMatch.mockRejectedValue(new Error('El partido no existe'))
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Editar partido Nacional vs Peñarol' }))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('El partido no existe')).toBeInTheDocument()
  })
})
