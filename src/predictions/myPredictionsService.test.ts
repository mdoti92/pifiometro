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

  it('marca como cargado un partido con pronostico guardado, mostrando los goles y el equipo', async () => {
    const matches = [
      {
        id: 'match-1',
        kickoff_at: '2999-01-01T20:00:00Z',
        home: { name: 'Nacional', alias: null, slug: 'nacional' },
        away: { name: 'Peñarol', alias: null, slug: 'penarol' },
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
        homeTeamSlug: 'nacional',
        awayTeamSlug: 'penarol',
        kickoffAt: '2999-01-01T20:00:00Z',
        status: 'cargado',
        homeGoals: 2,
        awayGoals: 1,
      },
    ])
  })

  it('usa el alias del equipo cuando esta cargado', async () => {
    const matches = [
      {
        id: 'match-1',
        kickoff_at: '2999-01-01T20:00:00Z',
        home: { name: 'Danubio', alias: 'Diluvio', slug: 'danubio' },
        away: { name: 'Wanderers', alias: null, slug: 'wanderers' },
      },
    ]
    const matchesQuery = mockMatchesQuery(matches)
    const predictionsQuery = mockPredictionsQuery([])
    mockedFrom
      .mockReturnValueOnce({ select: matchesQuery.select } as never)
      .mockReturnValueOnce({ select: predictionsQuery.select } as never)

    const result = await listMatchPredictionStatuses('stage-1', 'group-1', 'user-1')

    expect(result[0].homeTeam).toBe('Diluvio')
    expect(result[0].awayTeam).toBe('Wanderers')
  })

  it('marca como pendiente un partido sin pronostico que todavia no arranco', async () => {
    const matches = [
      {
        id: 'match-2',
        kickoff_at: '2999-01-01T20:00:00Z',
        home: { name: 'Danubio', alias: null, slug: 'danubio' },
        away: { name: 'Wanderers', alias: null, slug: 'wanderers' },
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
        homeTeamSlug: 'danubio',
        awayTeamSlug: 'wanderers',
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
        kickoff_at: '2000-01-01T20:00:00Z',
        home: { name: 'Cerro', alias: null, slug: 'cerro' },
        away: { name: 'Liverpool', alias: null, slug: 'liverpool' },
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
        homeTeamSlug: 'cerro',
        awayTeamSlug: 'liverpool',
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
