import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

afterEach(() => {
  vi.useRealTimers()
})

describe('PredictionHero', () => {
  it('muestra el total de puntos y la posicion del usuario en la etapa, como chip', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-2', displayName: 'Aldo', totalPoints: 9, rank: 1 },
      { userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 2 },
    ])

    render(<PredictionHero groupId="group-1" stageId="stage-1" userId="user-1" statuses={[]} />)

    expect(mockedGetGroupStageStandings).toHaveBeenCalledWith('group-1', 'stage-1')
    expect(await screen.findByText('6 pts - 2° lugar')).toBeInTheDocument()
  })

  it('pinta el chip de verde (moss) cuando el usuario va primero', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 10, rank: 1 },
    ])

    render(<PredictionHero groupId="group-1" stageId="stage-1" userId="user-1" statuses={[]} />)

    const chip = await screen.findByText('10 pts - 1° lugar')
    expect(chip).toHaveStyle({ backgroundColor: 'var(--moss)' })
  })

  it('pinta el chip de amarillo (gold) cuando el usuario va segundo', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 2 },
    ])

    render(<PredictionHero groupId="group-1" stageId="stage-1" userId="user-1" statuses={[]} />)

    const chip = await screen.findByText('6 pts - 2° lugar')
    expect(chip).toHaveStyle({ backgroundColor: 'var(--gold)' })
  })

  it('pinta el chip de rojo (rust) cuando el usuario va tercero', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 2, rank: 3 },
    ])

    render(<PredictionHero groupId="group-1" stageId="stage-1" userId="user-1" statuses={[]} />)

    const chip = await screen.findByText('2 pts - 3° lugar')
    expect(chip).toHaveStyle({ backgroundColor: 'var(--rust)' })
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
    expect(screen.getByText('6 pts - 1° lugar')).toBeInTheDocument()
  })

  it('muestra la cuenta regresiva con dias cuando faltan mas de 24 horas, con relleno de ceros', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    mockedGetGroupStageStandings.mockResolvedValue([])

    render(
      <PredictionHero
        groupId="group-1"
        stageId="stage-1"
        userId="user-1"
        statuses={[pendingMatch({ kickoffAt: '2026-01-05T20:31:06.000Z' })]}
      />,
    )

    expect(screen.getByText('4d 20h 31m 06s')).toBeInTheDocument()
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

    expect(await screen.findByText('6 pts - 1° lugar')).toBeInTheDocument()
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
