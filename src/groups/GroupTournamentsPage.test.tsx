import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as groupMembersService from './groupMembersService'
import { GroupTournamentsPage } from './GroupTournamentsPage'
import * as groupTournamentsService from './groupTournamentsService'

vi.mock('./groupMembersService', async () => {
  const actual =
    await vi.importActual<typeof import('./groupMembersService')>('./groupMembersService')
  return { ...actual, isGroupAdmin: vi.fn() }
})

vi.mock('./groupTournamentsService', async () => {
  const actual =
    await vi.importActual<typeof import('./groupTournamentsService')>('./groupTournamentsService')
  return {
    ...actual,
    listAvailableTournaments: vi.fn(),
    listGroupTournaments: vi.fn(),
    activateTournament: vi.fn(),
    deactivateTournament: vi.fn(),
  }
})

const mockedIsGroupAdmin = vi.mocked(groupMembersService.isGroupAdmin)
const mockedListAvailableTournaments = vi.mocked(groupTournamentsService.listAvailableTournaments)
const mockedListGroupTournaments = vi.mocked(groupTournamentsService.listGroupTournaments)
const mockedActivateTournament = vi.mocked(groupTournamentsService.activateTournament)
const mockedDeactivateTournament = vi.mocked(groupTournamentsService.deactivateTournament)

beforeEach(() => {
  vi.clearAllMocks()
  mockedListAvailableTournaments.mockResolvedValue([
    { id: 'tournament-1', name: 'Liga AUF 2026', season: '2026' },
    { id: 'tournament-2', name: 'Copa AUF', season: '2026' },
  ])
  mockedListGroupTournaments.mockResolvedValue([
    { tournamentId: 'tournament-1', name: 'Liga AUF 2026', season: '2026', active: true },
  ])
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/groups/group-1/tournaments']}>
      <Routes>
        <Route path="/groups/:groupId/tournaments" element={<GroupTournamentsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GroupTournamentsPage', () => {
  it('lista los torneos disponibles como tabla, con la temporada y un badge para la vigente, sin controles para no-admins', async () => {
    mockedIsGroupAdmin.mockResolvedValue(false)
    renderPage()

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(await screen.findByText('Liga AUF 2026')).toBeInTheDocument()
    expect(screen.getByText('Copa AUF')).toBeInTheDocument()
    expect(screen.getAllByText('— Temporada 2026', { exact: false })).toHaveLength(2)
    expect(screen.getByText('Vigente')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Activar|Desactivar/ })).not.toBeInTheDocument()
  })

  it('activa un torneo inactivo para el grupo, siendo admin', async () => {
    mockedIsGroupAdmin.mockResolvedValue(true)
    mockedActivateTournament.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    const activateButton = await screen.findByRole('button', { name: 'Activar Copa AUF' })
    await user.click(activateButton)

    expect(mockedActivateTournament).toHaveBeenCalledWith('group-1', 'tournament-2')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Desactivar Copa AUF' })).toBeInTheDocument(),
    )
  })

  it('desactiva un torneo activo para el grupo, siendo admin', async () => {
    mockedIsGroupAdmin.mockResolvedValue(true)
    mockedDeactivateTournament.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    const deactivateButton = await screen.findByRole('button', { name: 'Desactivar Liga AUF 2026' })
    await user.click(deactivateButton)

    expect(mockedDeactivateTournament).toHaveBeenCalledWith('group-1', 'tournament-1')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Activar Liga AUF 2026' })).toBeInTheDocument(),
    )
  })

  it('muestra links a Tabla e Historial para cualquier temporada vinculada al grupo, este activa o no, sin necesidad de reactivarla', async () => {
    mockedListAvailableTournaments.mockResolvedValue([
      { id: 'tournament-1', name: 'Liga AUF 2026', season: '2026' },
      { id: 'tournament-2', name: 'Liga AUF 2025', season: '2025' },
      { id: 'tournament-3', name: 'Copa AUF', season: '2026' },
    ])
    mockedListGroupTournaments.mockResolvedValue([
      { tournamentId: 'tournament-1', name: 'Liga AUF 2026', season: '2026', active: true },
      { tournamentId: 'tournament-2', name: 'Liga AUF 2025', season: '2025', active: false },
    ])
    mockedIsGroupAdmin.mockResolvedValue(false)
    renderPage()

    await screen.findByText('Liga AUF 2026')

    expect(screen.getByRole('link', { name: 'Ver tabla de Liga AUF 2026' })).toHaveAttribute(
      'href',
      '/groups/group-1/tournaments/tournament-1/standings',
    )
    expect(screen.getByRole('link', { name: 'Ver historial de Liga AUF 2025' })).toHaveAttribute(
      'href',
      '/groups/group-1/tournaments/tournament-2/history',
    )
    expect(screen.queryByRole('link', { name: 'Ver tabla de Copa AUF' })).not.toBeInTheDocument()
  })

  it('ordena las temporadas de mas reciente a mas antigua', async () => {
    mockedListAvailableTournaments.mockResolvedValue([
      { id: 'tournament-2', name: 'Liga AUF 2024', season: '2024' },
      { id: 'tournament-1', name: 'Liga AUF 2026', season: '2026' },
    ])
    mockedListGroupTournaments.mockResolvedValue([])
    mockedIsGroupAdmin.mockResolvedValue(false)
    renderPage()

    await screen.findByText('Liga AUF 2026')
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Liga AUF 2026')
    expect(rows[2]).toHaveTextContent('Liga AUF 2024')
  })

  it('muestra un error cuando falla la activacion', async () => {
    mockedIsGroupAdmin.mockResolvedValue(true)
    mockedActivateTournament.mockRejectedValue(new Error('permission denied'))
    const user = userEvent.setup()
    renderPage()

    const activateButton = await screen.findByRole('button', { name: 'Activar Copa AUF' })
    await user.click(activateButton)

    expect(await screen.findByText('permission denied')).toBeInTheDocument()
  })
})
