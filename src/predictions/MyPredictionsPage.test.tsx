import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import * as standingsService from '../standings/standingsService'
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

vi.mock('../standings/standingsService', async () => {
  const actual =
    await vi.importActual<typeof import('../standings/standingsService')>('../standings/standingsService')
  return { ...actual, getGroupStageStandings: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedListMatchPredictionStatuses = vi.mocked(myPredictionsService.listMatchPredictionStatuses)
const mockedGetGroupStageStandings = vi.mocked(standingsService.getGroupStageStandings)

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { access_token: 't' } as never,
    user: { id: 'user-1' } as never,
    loading: false,
  })
  mockedGetGroupStageStandings.mockResolvedValue([
    { userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 1 },
  ])
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
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

function match(overrides: Partial<myPredictionsService.MatchPredictionStatus>) {
  return {
    matchId: 'match-1',
    homeTeam: 'Nacional',
    awayTeam: 'Peñarol',
    homeTeamSlug: 'nacional',
    awayTeamSlug: 'penarol',
    kickoffAt: '2999-01-01T20:00:00Z',
    matchday: 1,
    matchStatus: 'scheduled' as const,
    status: 'pendiente' as const,
    homeGoals: null,
    awayGoals: null,
    ...overrides,
  }
}

describe('MyPredictionsPage', () => {
  it('agrupa los partidos por fecha, en grilla, con escudos y estado del pronostico centrado', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([
      match({ matchId: 'match-1', matchday: 1, status: 'cargado', homeGoals: 2, awayGoals: 1 }),
      match({ matchId: 'match-2', homeTeam: 'Danubio', awayTeam: 'Wanderers', homeTeamSlug: 'danubio', awayTeamSlug: 'wanderers', matchday: 2, status: 'pendiente' }),
    ])
    renderPage()

    expect(await screen.findByText('Fecha 1')).toBeInTheDocument()
    expect(screen.getByText('Fecha 2')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Nacional' })).toHaveAttribute('src', '/team-logos/nacional.svg')
    expect(screen.getByText('Cargado: 2-1')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('muestra el resumen de puntaje propio en vez del cartel de cuenta regresiva', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([match({})])
    renderPage()

    expect(await screen.findByText('6 pts')).toBeInTheDocument()
    expect(screen.getByText('1° lugar')).toBeInTheDocument()
    expect(screen.queryByText('Cierra en:')).not.toBeInTheDocument()
  })

  it('muestra un partido finalizado sin pronostico como no pronosticado, sin link de edicion', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([
      match({ matchday: 1, matchStatus: 'finished', status: 'no_pronosticado' }),
    ])
    renderPage()

    expect(await screen.findByText('No pronosticado')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Cargar/ })).not.toBeInTheDocument()
  })

  it('enlaza a la pantalla de carga para un partido pendiente', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([match({ status: 'pendiente' })])
    renderPage()

    const link = await screen.findByRole('link', {
      name: 'Cargar o editar pronóstico de Nacional vs Peñarol',
    })
    expect(link).toHaveAttribute('href', '/groups/group-1/matches/match-1/predict')
  })

  it('muestra el boton para ir a la ultima fecha con partidos finalizados, y no aparece si no hay ninguno', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([
      match({ matchId: 'match-1', matchday: 1, matchStatus: 'finished', status: 'cargado', homeGoals: 1, awayGoals: 0 }),
      match({ matchId: 'match-2', matchday: 2, matchStatus: 'scheduled', status: 'pendiente' }),
    ])
    renderPage()

    const button = await screen.findByRole('button', { name: 'Ver desde última fecha cargada' })
    const user = userEvent.setup()
    await user.click(button)

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('no muestra el boton de ultima fecha cuando ningun partido esta finalizado', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([match({ matchStatus: 'scheduled' })])
    renderPage()

    await screen.findByText('Fecha 1')
    expect(screen.queryByRole('button', { name: 'Ver desde última fecha cargada' })).not.toBeInTheDocument()
  })
})
