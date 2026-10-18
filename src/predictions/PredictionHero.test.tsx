import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MatchPredictionStatus } from './myPredictionsService'
import { PredictionHero } from './PredictionHero'

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
    actualHomeGoals: null,
    actualAwayGoals: null,
    outcome: null,
    points: null,
    ...overrides,
  }
}

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('PredictionHero', () => {
  it('no muestra nada cuando no hay ningun partido pendiente', () => {
    const { container } = render(<PredictionHero statuses={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('muestra la cuenta regresiva al proximo partido pendiente', () => {
    render(<PredictionHero statuses={[pendingMatch()]} />)

    expect(screen.getByText('Cierra en:')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Danubio vs Wanderers' })).toBeInTheDocument()
  })

  it('muestra la cuenta regresiva con dias cuando faltan mas de 24 horas, con relleno de ceros', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    render(<PredictionHero statuses={[pendingMatch({ kickoffAt: '2026-01-05T20:31:06.000Z' })]} />)

    expect(screen.getByText('4d 20h 31m 06s')).toBeInTheDocument()
  })

  it('no muestra nada cuando el unico partido ya tiene pronostico cargado', () => {
    const { container } = render(
      <PredictionHero statuses={[pendingMatch({ status: 'cargado', homeGoals: 1, awayGoals: 0 })]} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('al tocar el cartel de cuenta regresiva, scrollea hasta la tarjeta del partido en la grilla', async () => {
    document.body.innerHTML = '<li id="match-match-1"></li>'

    render(<PredictionHero statuses={[pendingMatch()]} />)

    const card = await screen.findByRole('button', {
      name: 'Ir al pronóstico de Danubio vs Wanderers',
    })
    card.click()

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
  })
})
