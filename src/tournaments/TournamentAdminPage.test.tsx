import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TournamentAdminPage } from './TournamentAdminPage'
import * as tournamentsService from './tournamentsService'

vi.mock('./tournamentsService', async () => {
  const actual =
    await vi.importActual<typeof import('./tournamentsService')>('./tournamentsService')
  return {
    ...actual,
    isSuperadmin: vi.fn(),
    createTournament: vi.fn(),
    listTournamentStages: vi.fn(),
    renameStage: vi.fn(),
  }
})

const mockedIsSuperadmin = vi.mocked(tournamentsService.isSuperadmin)
const mockedCreateTournament = vi.mocked(tournamentsService.createTournament)
const mockedListTournamentStages = vi.mocked(tournamentsService.listTournamentStages)
const mockedRenameStage = vi.mocked(tournamentsService.renameStage)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TournamentAdminPage', () => {
  it('deniega el acceso cuando el usuario no es superadmin', async () => {
    mockedIsSuperadmin.mockResolvedValue(false)
    render(<TournamentAdminPage />)

    expect(
      await screen.findByText('No tenés permisos para administrar torneos'),
    ).toBeInTheDocument()
    expect(mockedCreateTournament).not.toHaveBeenCalled()
  })

  it('permite agregar y quitar etapas antes de crear el torneo', async () => {
    mockedIsSuperadmin.mockResolvedValue(true)
    const user = userEvent.setup()
    render(<TournamentAdminPage />)

    await screen.findByLabelText('Nombre del torneo')
    expect(screen.getAllByLabelText(/Etapa \d+/)).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Agregar etapa' }))
    expect(screen.getAllByLabelText(/Etapa \d+/)).toHaveLength(2)

    await user.click(screen.getAllByRole('button', { name: 'Quitar etapa' })[0])
    expect(screen.getAllByLabelText(/Etapa \d+/)).toHaveLength(1)
  })

  it('crea el torneo con sus etapas y las muestra en el orden ingresado', async () => {
    mockedIsSuperadmin.mockResolvedValue(true)
    mockedCreateTournament.mockResolvedValue({
      id: 'tournament-1',
      name: 'Liga AUF 2026',
      season: '2026',
    })
    mockedListTournamentStages.mockResolvedValue([
      { id: 'stage-1', tournamentId: 'tournament-1', name: 'Apertura', orderIndex: 0 },
      { id: 'stage-2', tournamentId: 'tournament-1', name: 'Clausura', orderIndex: 1 },
    ])
    const user = userEvent.setup()
    render(<TournamentAdminPage />)

    await user.type(await screen.findByLabelText('Nombre del torneo'), 'Liga AUF 2026')
    await user.type(screen.getByLabelText('Temporada'), '2026')
    await user.type(screen.getByLabelText('Etapa 1'), 'Apertura')
    await user.click(screen.getByRole('button', { name: 'Agregar etapa' }))
    await user.type(screen.getByLabelText('Etapa 2'), 'Clausura')
    await user.click(screen.getByRole('button', { name: 'Crear torneo' }))

    expect(mockedCreateTournament).toHaveBeenCalledWith('Liga AUF 2026', '2026', [
      'Apertura',
      'Clausura',
    ])

    await screen.findAllByRole('listitem')
    expect(screen.getByDisplayValue('Apertura')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Clausura')).toBeInTheDocument()
  })

  it('muestra un error cuando falla la creacion del torneo', async () => {
    mockedIsSuperadmin.mockResolvedValue(true)
    mockedCreateTournament.mockRejectedValue(new Error('permission denied'))
    const user = userEvent.setup()
    render(<TournamentAdminPage />)

    await user.type(await screen.findByLabelText('Nombre del torneo'), 'Liga AUF 2026')
    await user.type(screen.getByLabelText('Temporada'), '2026')
    await user.type(screen.getByLabelText('Etapa 1'), 'Apertura')
    await user.click(screen.getByRole('button', { name: 'Crear torneo' }))

    expect(await screen.findByText('permission denied')).toBeInTheDocument()
  })

  it('permite renombrar una etapa existente', async () => {
    mockedIsSuperadmin.mockResolvedValue(true)
    mockedCreateTournament.mockResolvedValue({
      id: 'tournament-1',
      name: 'Liga AUF 2026',
      season: '2026',
    })
    mockedListTournamentStages.mockResolvedValue([
      { id: 'stage-1', tournamentId: 'tournament-1', name: 'Apertura', orderIndex: 0 },
    ])
    mockedRenameStage.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TournamentAdminPage />)

    await user.type(await screen.findByLabelText('Nombre del torneo'), 'Liga AUF 2026')
    await user.type(screen.getByLabelText('Temporada'), '2026')
    await user.type(screen.getByLabelText('Etapa 1'), 'Apertura')
    await user.click(screen.getByRole('button', { name: 'Crear torneo' }))

    await screen.findAllByRole('listitem')
    const renameInput = screen.getByDisplayValue('Apertura')
    await user.clear(renameInput)
    await user.type(renameInput, 'Apertura 2026')
    await user.click(screen.getByRole('button', { name: 'Guardar nombre de etapa' }))

    await waitFor(() => expect(mockedRenameStage).toHaveBeenCalledWith('stage-1', 'Apertura 2026'))
  })
})
