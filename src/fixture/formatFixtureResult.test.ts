import { describe, expect, it } from 'vitest'
import type { FixtureMatch } from './fixtureService'
import { formatFixtureResult } from './formatFixtureResult'

function baseMatch(overrides: Partial<FixtureMatch>): FixtureMatch {
  return {
    id: 'match-1',
    homeTeam: 'Nacional',
    awayTeam: 'Peñarol',
    homeTeamSlug: 'nacional',
    awayTeamSlug: 'penarol',
    kickoffAt: '2026-03-01T20:00:00Z',
    matchday: 1,
    status: 'scheduled',
    homeGoals: null,
    awayGoals: null,
    isElimination: false,
    wentToPenalties: false,
    homeGoalsPenalties: null,
    awayGoalsPenalties: null,
    ...overrides,
  }
}

describe('formatFixtureResult', () => {
  it('muestra la fecha y hora del kickoff en hora local de Uruguay (UTC-3), no en UTC', () => {
    const match = baseMatch({ status: 'scheduled', kickoffAt: '2026-03-01T20:00:00Z' })

    expect(formatFixtureResult(match)).toBe('1/3/2026, 17:00')
  })

  it('ajusta tambien la fecha cuando la conversion a hora local cruza la medianoche', () => {
    const match = baseMatch({ status: 'scheduled', kickoffAt: '2026-10-20T01:30:00Z' })

    expect(formatFixtureResult(match)).toBe('19/10/2026, 22:30')
  })

  it('muestra el resultado final para un partido jugado', () => {
    const match = baseMatch({ status: 'finished', homeGoals: 2, awayGoals: 1 })

    expect(formatFixtureResult(match)).toBe('2-1')
  })

  it('distingue el resultado de los 90 minutos del resultado por penales', () => {
    const match = baseMatch({
      status: 'finished',
      isElimination: true,
      homeGoals: 1,
      awayGoals: 1,
      wentToPenalties: true,
      homeGoalsPenalties: 4,
      awayGoalsPenalties: 3,
    })

    expect(formatFixtureResult(match)).toBe('1-1 (penales 4-3)')
  })

  it('muestra postergado para un partido pospuesto', () => {
    const match = baseMatch({ status: 'postponed' })

    expect(formatFixtureResult(match)).toBe('Postergado')
  })
})
