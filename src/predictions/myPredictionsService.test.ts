import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { listMatchPredictionStatuses } from './myPredictionsService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockedFrom = vi.mocked(supabase.from)

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-01T20:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

function mockMatchesQuery(matches: unknown[]) {
  const order = vi.fn().mockResolvedValue({ data: matches, error: null })
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  return { select, eq, order }
}

function mockPredictionsQuery(predictions: unknown[]) {
  const inFn = vi.fn().mockResolvedValue({ data: predictions, error: null })
  const eq2 = vi.fn().mockReturnValue({ in: inFn })
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
  const select = vi.fn().mockReturnValue({ eq: eq1 })
  return { select, eq1, eq2, inFn }
}

describe('listMatchPredictionStatuses', () => {
  it('devuelve lista vacia sin consultar predictions cuando la etapa no tiene partidos', async () => {
    const matchesQuery = mockMatchesQuery([])
    mockedFrom.mockReturnValueOnce({ select: matchesQuery.select } as never)

    const result = await listMatchPredictionStatuses('stage-1', 'group-1', 'user-1')

    expect(result).toEqual([])
    expect(mockedFrom).toHaveBeenCalledTimes(1)
  })

  it('marca como cargado un partido con pronostico guardado, mostrando los goles', async () => {
    const matches = [
      {
        id: 'match-1',
        home_team: 'Nacional',
        away_team: 'Peñarol',
        kickoff_at: '2999-01-01T20:00:00Z',
      },
    ]
    const predictions = [{ match_id: 'match-1', home_goals: 2, away_goals: 1 }]
    const matchesQuery = mockMatchesQuery(matches)
    const predictionsQuery = mockPredictionsQuery(predictions)
    mockedFrom
      .mockReturnValueOnce({ select: matchesQuery.select } as never)
      .mockReturnValueOnce({ select: predictionsQuery.select } as never)

    const result = await listMatchPredictionStatuses('stage-1', 'group-1', 'user-1')

    expect(result).toEqual([
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
  })

  it('marca como pendiente un partido sin pronostico que todavia no arranco', async () => {
    const matches = [
      {
        id: 'match-2',
        home_team: 'Danubio',
        away_team: 'Wanderers',
        kickoff_at: '2999-01-01T20:00:00Z',
      },
    ]
    const matchesQuery = mockMatchesQuery(matches)
    const predictionsQuery = mockPredictionsQuery([])
    mockedFrom
      .mockReturnValueOnce({ select: matchesQuery.select } as never)
      .mockReturnValueOnce({ select: predictionsQuery.select } as never)

    const result = await listMatchPredictionStatuses('stage-1', 'group-1', 'user-1')

    expect(result).toEqual([
      {
        matchId: 'match-2',
        homeTeam: 'Danubio',
        awayTeam: 'Wanderers',
        kickoffAt: '2999-01-01T20:00:00Z',
        status: 'pendiente',
        homeGoals: null,
        awayGoals: null,
      },
    ])
  })

  it('marca como no pronosticado un partido ya cerrado sin pronostico mio', async () => {
    const matches = [
      {
        id: 'match-3',
        home_team: 'Cerro',
        away_team: 'Liverpool',
        kickoff_at: '2000-01-01T20:00:00Z',
      },
    ]
    const matchesQuery = mockMatchesQuery(matches)
    const predictionsQuery = mockPredictionsQuery([])
    mockedFrom
      .mockReturnValueOnce({ select: matchesQuery.select } as never)
      .mockReturnValueOnce({ select: predictionsQuery.select } as never)

    const result = await listMatchPredictionStatuses('stage-1', 'group-1', 'user-1')

    expect(result).toEqual([
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
  })

  it('propaga el error cuando falla la consulta de partidos', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValueOnce({ select } as never)

    await expect(listMatchPredictionStatuses('stage-1', 'group-1', 'user-1')).rejects.toThrow(
      'permission denied',
    )
  })
})
