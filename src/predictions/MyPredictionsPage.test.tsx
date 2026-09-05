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
    expect(screen.getByText(/Danubio vs Wanderers/)).toBeInTheDocument()
    expect(screen.getByText(/Pendiente/)).toBeInTheDocument()
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

  it('enlaza a la pantalla de carga solo para partidos que todavia se pueden pronosticar', async () => {
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
      name: 'Cargar o editar pronóstico de Danubio vs Wanderers',
    })
    expect(link).toHaveAttribute('href', '/groups/group-1/matches/match-2/predict')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
