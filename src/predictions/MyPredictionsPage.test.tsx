import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import * as predictionsService from './predictionsService'
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

vi.mock('./predictionsService', async () => {
  const actual =
    await vi.importActual<typeof import('./predictionsService')>('./predictionsService')
  return { ...actual, savePrediction: vi.fn() }
})

vi.mock('../standings/standingsService', async () => {
  const actual =
    await vi.importActual<typeof import('../standings/standingsService')>('../standings/standingsService')
  return { ...actual, getGroupStageStandings: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedListMatchPredictionStatuses = vi.mocked(myPredictionsService.listMatchPredictionStatuses)
const mockedSavePrediction = vi.mocked(predictionsService.savePrediction)
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
  it('agrupa los partidos por fecha, en grilla, con escudos e inputs editables centrados', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([
      match({ matchId: 'match-1', matchday: 1, status: 'cargado', homeGoals: 2, awayGoals: 1 }),
      match({ matchId: 'match-2', homeTeam: 'Danubio', awayTeam: 'Wanderers', homeTeamSlug: 'danubio', awayTeamSlug: 'wanderers', matchday: 2, status: 'pendiente' }),
    ])
    renderPage()

    expect(await screen.findByText('Fecha 1')).toBeInTheDocument()
    expect(screen.getByText('Fecha 2')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Nacional' })).toHaveAttribute('src', '/team-logos/nacional.svg')
    expect(screen.getByLabelText('Goles local de Nacional')).toHaveValue(2)
    expect(screen.getByLabelText('Goles visitante de Peñarol')).toHaveValue(1)
    expect(screen.getByLabelText('Goles local de Danubio')).toHaveValue(null)
    expect(screen.getByLabelText('Goles visitante de Wanderers')).toHaveValue(null)
  })

  it('muestra el resumen de puntaje propio', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([
      match({ matchStatus: 'finished', status: 'cargado', homeGoals: 2, awayGoals: 1 }),
    ])
    renderPage()

    expect(await screen.findByText('6 pts - 1° lugar')).toBeInTheDocument()
    expect(screen.queryByText('Cierra en:')).not.toBeInTheDocument()
  })

  it('ademas del puntaje, destaca en un cartel la cuenta regresiva al proximo partido pendiente', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([match({ matchStatus: 'scheduled', status: 'pendiente' })])
    renderPage()

    expect(await screen.findByText('6 pts - 1° lugar')).toBeInTheDocument()
    expect(screen.getByText('Cierra en:')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Nacional vs Peñarol' })).toBeInTheDocument()
  })

  it('al tocar el cartel de cuenta regresiva, scrollea hasta la tarjeta de ese partido en la grilla', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([match({ matchStatus: 'scheduled', status: 'pendiente' })])
    const user = userEvent.setup()
    renderPage()

    await user.click(
      await screen.findByRole('button', { name: 'Ir al pronóstico de Nacional vs Peñarol' }),
    )

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
    expect(screen.getByLabelText('Goles local de Nacional')).toBeInTheDocument()
  })

  it('muestra el boton para ir a la ultima fecha con partidos finalizados', async () => {
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

  it('muestra los inputs editables directamente, sin lapiz ni paso previo, para un partido pendiente', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([match({ matchStatus: 'scheduled', status: 'pendiente' })])
    renderPage()

    expect(await screen.findByLabelText('Goles local de Nacional')).toBeInTheDocument()
    expect(screen.getByLabelText('Goles visitante de Peñarol')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Editar pronóstico de Nacional vs Peñarol' }),
    ).not.toBeInTheDocument()
  })

  it('tambien muestra los inputs editables para un partido postponed sin resultado real', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([match({ matchStatus: 'postponed', status: 'pendiente' })])
    renderPage()

    expect(await screen.findByLabelText('Goles local de Nacional')).toBeInTheDocument()
    expect(screen.getByLabelText('Goles visitante de Peñarol')).toBeInTheDocument()
  })

  it('no muestra inputs editables para un partido finalizado, y se ve de solo lectura', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([
      match({ matchStatus: 'finished', status: 'cargado', homeGoals: 2, awayGoals: 1 }),
    ])
    renderPage()

    expect(await screen.findByText('Cargado: 2-1')).toBeInTheDocument()
    expect(screen.queryByLabelText('Goles local de Nacional')).not.toBeInTheDocument()
  })

  it('guarda el pronostico automaticamente al completar los dos inputs, sin boton de confirmar', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([match({ matchStatus: 'scheduled', status: 'pendiente' })])
    mockedSavePrediction.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument()

    await user.type(await screen.findByLabelText('Goles local de Nacional'), '2')
    await user.type(screen.getByLabelText('Goles visitante de Peñarol'), '1')

    await waitFor(() =>
      expect(mockedSavePrediction).toHaveBeenCalledWith({
        matchId: 'match-1',
        groupId: 'group-1',
        userId: 'user-1',
        homeGoals: 2,
        awayGoals: 1,
      }),
    )
    expect(mockedListMatchPredictionStatuses).toHaveBeenCalledTimes(1)
  })

  it('no guarda todavia si solo se completo uno de los dos inputs', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([match({ matchStatus: 'scheduled', status: 'pendiente' })])
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Goles local de Nacional'), '2')

    expect(mockedSavePrediction).not.toHaveBeenCalled()
  })

  it('muestra un error cuando falla el guardado automatico, sin perder lo tipeado', async () => {
    mockedListMatchPredictionStatuses.mockResolvedValue([match({ matchStatus: 'scheduled', status: 'pendiente' })])
    mockedSavePrediction.mockRejectedValue(new Error('permission denied'))
    const user = userEvent.setup()
    renderPage()

    await user.type(await screen.findByLabelText('Goles local de Nacional'), '2')
    await user.type(screen.getByLabelText('Goles visitante de Peñarol'), '1')

    expect(await screen.findByText('permission denied')).toBeInTheDocument()
    expect(screen.getByLabelText('Goles local de Nacional')).toHaveValue(2)
  })
})
