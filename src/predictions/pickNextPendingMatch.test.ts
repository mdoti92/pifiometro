import { describe, expect, it } from 'vitest'
import type { MatchPredictionStatus } from './myPredictionsService'
import { pickNextPendingMatch } from './pickNextPendingMatch'

const NOW = new Date('2026-03-01T20:00:00Z')

function pending(matchId: string, kickoffAt: string): MatchPredictionStatus {
  return {
    matchId,
    homeTeam: 'Local',
    awayTeam: 'Visitante',
    homeTeamSlug: 'local',
    awayTeamSlug: 'visitante',
    kickoffAt,
    status: 'pendiente',
    homeGoals: null,
    awayGoals: null,
  }
}

function cargado(matchId: string, kickoffAt: string): MatchPredictionStatus {
  return { ...pending(matchId, kickoffAt), status: 'cargado', homeGoals: 1, awayGoals: 0 }
}

describe('pickNextPendingMatch', () => {
  it('devuelve null cuando no hay partidos', () => {
    expect(pickNextPendingMatch([], NOW)).toBeNull()
  })

  it('devuelve null cuando no hay ningun partido pendiente', () => {
    const statuses = [cargado('match-1', '2026-03-02T20:00:00Z')]
    expect(pickNextPendingMatch(statuses, NOW)).toBeNull()
  })

  it('devuelve el pendiente cuyo kickoff esta mas cerca', () => {
    const statuses = [
      pending('match-1', '2026-03-05T20:00:00Z'),
      pending('match-2', '2026-03-02T20:00:00Z'),
      cargado('match-3', '2026-03-01T21:00:00Z'),
    ]

    expect(pickNextPendingMatch(statuses, NOW)?.matchId).toBe('match-2')
  })

  it('ignora un pendiente cuyo kickoff ya paso, aunque el status siga diciendo pendiente', () => {
    const statuses = [
      pending('match-1', '2026-03-01T19:00:00Z'),
      pending('match-2', '2026-03-03T20:00:00Z'),
    ]

    expect(pickNextPendingMatch(statuses, NOW)?.matchId).toBe('match-2')
  })
})
