import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as standingsService from '../standings/standingsService'
import type { MatchPredictionStatus } from './myPredictionsService'
import { PredictionHero } from './PredictionHero'

vi.mock('../standings/standingsService', async () => {
  const actual =
    await vi.importActual<typeof import('../standings/standingsService')>('../standings/standingsService')
  return { ...actual, getGroupStageStandings: vi.fn() }
})

const mockedGetGroupStageStandings = vi.mocked(standingsService.getGroupStageStandings)

function pendingMatch(overrides: Partial<MatchPredictionStatus> = {}): MatchPredictionStatus {
  return {
    matchId: 'match-1',
    homeTeam: 'Danubio',
    awayTeam: 'Wanderers',
    homeTeamSlug: 'danubio',
    awayTeamSlug: 'wanderers',
    kickoffAt: '2999-01-01T20:00:00Z',
    matchday: 1,
    matchStatus: 'scheduled',
    status: 'pendiente',
    homeGoals: null,
    awayGoals: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

describe('PredictionHero', () => {
  it('muestra el total de puntos y la posicion del usuario en la etapa', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-2', displayName: 'Aldo', totalPoints: 9, rank: 1 },
      { userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 2 },
    ])

    render(<PredictionHero groupId="group-1" stageId="stage-1" userId="user-1" statuses={[]} />)

    expect(mockedGetGroupStageStandings).toHaveBeenCalledWith('group-1', 'stage-1')
    expect(await screen.findByText('6 pts')).toBeInTheDocument()
    expect(screen.getByText('2° lugar')).toBeInTheDocument()
  })

  it('no muestra nada cuando no hay posicion en la tabla ni partido pendiente', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([])

    const { container } = render(
      <PredictionHero groupId="group-1" stageId="stage-1" userId="user-1" statuses={[]} />,
    )

    await waitFor(() => expect(mockedGetGroupStageStandings).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra la cuenta regresiva al proximo partido pendiente, ademas del puntaje', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 1 },
    ])

    render(
      <PredictionHero
        groupId="group-1"
        stageId="stage-1"
        userId="user-1"
        statuses={[pendingMatch()]}
      />,
    )

    expect(await screen.findByText('Cierra en:')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Danubio vs Wanderers' })).toBeInTheDocument()
    expect(screen.getByText('6 pts')).toBeInTheDocument()
  })

  it('no muestra la cuenta regresiva cuando no hay ningun partido pendiente', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 1 },
    ])

    render(
      <PredictionHero
        groupId="group-1"
        stageId="stage-1"
        userId="user-1"
        statuses={[pendingMatch({ status: 'cargado', homeGoals: 1, awayGoals: 0 })]}
      />,
    )

    expect(await screen.findByText('6 pts')).toBeInTheDocument()
    expect(screen.queryByText('Cierra en:')).not.toBeInTheDocument()
  })

  it('al tocar el cartel de cuenta regresiva, scrollea hasta la tarjeta del partido en la grilla', async () => {
    document.body.innerHTML = '<li id="match-match-1"></li>'

    render(
      <PredictionHero groupId="group-1" stageId="stage-1" userId="user-1" statuses={[pendingMatch()]} />,
    )

    const card = await screen.findByRole('button', {
      name: 'Ir al pronóstico de Danubio vs Wanderers',
    })
    card.click()

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
  })
})
