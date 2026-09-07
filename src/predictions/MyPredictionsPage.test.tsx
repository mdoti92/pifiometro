import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import { MyPredictionsPage } from './MyPredictionsPage'
import * as myPredictionsService from './myPredictionsService'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./myPredictionsService', async () => {
  const actual =
    await vi.importActual<typeof import('./myPredictionsService')>('./myPredictionsService')
  return { ...actual, listMatchPredictionStatuses: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedListMatchPredictionStatuses = vi.mocked(myPredictionsService.listMatchPredictionStatuses)

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
    <MemoryRouter initialEntries={['/groups/group-1/stages/stage-1/predictions']}>
      <Routes>
        <Route path="/groups/:groupId/stages/:stageId/predictions" element={<MyPredictionsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MyPredictionsPage', () => {
  it('muestra cada partido con su estado pendiente o cargado', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([
      {
        matchId: 'match-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        kickoffAt: '2999-01-01T20:00:00Z',
        status: 'cargado',
        homeGoals: 2,
        awayGoals: 1,
      },
      {
        matchId: 'match-2',
        homeTeam: 'Danubio',
        awayTeam: 'Wanderers',
        kickoffAt: '2999-01-02T20:00:00Z',
        status: 'pendiente',
        homeGoals: null,
        awayGoals: null,
      },
    ])
    renderPage()

    expect(await screen.findByText(/Nacional vs Peñarol/)).toBeInTheDocument()
    expect(screen.getByText(/Cargado: 2-1/)).toBeInTheDocument()
    // el partido pendiente mas proximo se destaca en el hero, no en la lista
    expect(screen.getByRole('heading', { name: 'Danubio vs Wanderers' })).toBeInTheDocument()
  })

  it('no muestra ningun hero cuando no tengo partidos pendientes', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([
      {
        matchId: 'match-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        kickoffAt: '2999-01-01T20:00:00Z',
        status: 'cargado',
        homeGoals: 2,
        awayGoals: 1,
      },
    ])
    renderPage()

    expect(await screen.findByText(/Nacional vs Peñarol/)).toBeInTheDocument()
    expect(screen.queryByText('Cierra en:')).not.toBeInTheDocument()
  })

  it('muestra un partido cerrado sin pronostico como no pronosticado, con 0 puntos posibles', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([
      {
        matchId: 'match-3',
        homeTeam: 'Cerro',
        awayTeam: 'Liverpool',
        kickoffAt: '2000-01-01T20:00:00Z',
        status: 'no_pronosticado',
        homeGoals: null,
        awayGoals: null,
      },
    ])
    renderPage()

    expect(
      await screen.findByText(/No pronosticado \(0 puntos posibles\)/),
    ).toBeInTheDocument()
  })

  it('enlaza a la pantalla de carga desde el hero para el proximo partido pendiente', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([
      {
        matchId: 'match-2',
        homeTeam: 'Danubio',
        awayTeam: 'Wanderers',
        kickoffAt: '2999-01-02T20:00:00Z',
        status: 'pendiente',
        homeGoals: null,
        awayGoals: null,
      },
      {
        matchId: 'match-3',
        homeTeam: 'Cerro',
        awayTeam: 'Liverpool',
        kickoffAt: '2000-01-01T20:00:00Z',
        status: 'no_pronosticado',
        homeGoals: null,
        awayGoals: null,
      },
    ])
    renderPage()

    const link = await screen.findByRole('link', {
      name: 'Cargar pronóstico de Danubio vs Wanderers',
    })
    expect(link).toHaveAttribute('href', '/groups/group-1/matches/match-2/predict')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('cuando hay dos pendientes, destaca en el hero el de kickoff mas cercano', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([
      {
        matchId: 'match-2',
        homeTeam: 'Danubio',
        awayTeam: 'Wanderers',
        kickoffAt: '2999-01-05T20:00:00Z',
        status: 'pendiente',
        homeGoals: null,
        awayGoals: null,
      },
      {
        matchId: 'match-4',
        homeTeam: 'Fenix',
        awayTeam: 'Rentistas',
        kickoffAt: '2999-01-02T20:00:00Z',
        status: 'pendiente',
        homeGoals: null,
        awayGoals: null,
      },
    ])
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Fenix vs Rentistas' })).toBeInTheDocument()
    expect(screen.getByText(/Danubio vs Wanderers — Pendiente/)).toBeInTheDocument()
  })
})
