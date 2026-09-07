import { describe, expect, it } from 'vitest'
import type { FixtureMatch } from './fixtureService'
import { groupMatchesByMatchday } from './groupMatchesByMatchday'

function match(id: string, matchday: number | null, kickoffAt: string): FixtureMatch {
  return {
    id,
    homeTeam: 'Local',
    awayTeam: 'Visitante',
    kickoffAt,
    matchday,
    status: 'scheduled',
    homeGoals: null,
    awayGoals: null,
    isElimination: false,
    wentToPenalties: false,
    homeGoalsPenalties: null,
    awayGoalsPenalties: null,
  }
}

describe('groupMatchesByMatchday', () => {
  it('devuelve una lista vacia sin partidos', () => {
    expect(groupMatchesByMatchday([])).toEqual([])
  })

  it('agrupa los partidos por matchday en orden ascendente', () => {
    const matches = [
      match('match-1', 2, '2026-03-08T20:00:00Z'),
      match('match-2', 1, '2026-03-01T20:00:00Z'),
      match('match-3', 1, '2026-03-01T22:00:00Z'),
    ]

    const groups = groupMatchesByMatchday(matches)

    expect(groups).toEqual([
      { matchday: 1, matches: [matches[1], matches[2]] },
      { matchday: 2, matches: [matches[0]] },
    ])
  })

  it('deja los partidos sin matchday asignado al final', () => {
    const matches = [
      match('match-1', null, '2026-03-01T20:00:00Z'),
      match('match-2', 1, '2026-03-05T20:00:00Z'),
    ]

    const groups = groupMatchesByMatchday(matches)

    expect(groups.map((g) => g.matchday)).toEqual([1, null])
  })
})
