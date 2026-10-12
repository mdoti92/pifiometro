import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { getMatchHistory } from './historyService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockedFrom = vi.mocked(supabase.from)

beforeEach(() => {
  vi.clearAllMocks()
})

function mockMatchesQuery(matches: unknown[]) {
  const order = vi.fn().mockResolvedValue({ data: matches, error: null })
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  return { select }
}

function mockPredictionsQuery(predictions: unknown[]) {
  const inFn = vi.fn().mockResolvedValue({ data: predictions, error: null })
  const eq2 = vi.fn().mockReturnValue({ in: inFn })
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
  const select = vi.fn().mockReturnValue({ eq: eq1 })
  return { select }
}

describe('getMatchHistory', () => {
  it('devuelve lista vacia sin consultar predictions cuando el torneo no tiene partidos', async () => {
    const matchesQuery = mockMatchesQuery([])
    mockedFrom.mockReturnValueOnce({ select: matchesQuery.select } as never)

    const result = await getMatchHistory('tournament-1', 'group-1', 'user-1')

    expect(result).toEqual([])
    expect(mockedFrom).toHaveBeenCalledTimes(1)
  })

  it('muestra un partido finalizado con pronostico, resultado real y estado exacto', async () => {
    const matches = [
      {
        id: 'match-1',
        kickoff_at: '2000-01-01T20:00:00Z',
        home_goals: 2,
        away_goals: 1,
        status: 'finished',
        home: { name: 'Nacional', alias: null, slug: 'nacional' },
        away: { name: 'Peñarol', alias: null, slug: 'penarol' },
      },
    ]
    const predictions = [{ match_id: 'match-1', home_goals: 2, away_goals: 1, status: 'exacto' }]
    mockedFrom
      .mockReturnValueOnce({ select: mockMatchesQuery(matches).select } as never)
      .mockReturnValueOnce({ select: mockPredictionsQuery(predictions).select } as never)

    const result = await getMatchHistory('tournament-1', 'group-1', 'user-1')

    expect(result).toEqual([
      {
        matchId: 'match-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        homeTeamSlug: 'nacional',
        awayTeamSlug: 'penarol',
        kickoffAt: '2000-01-01T20:00:00Z',
        predictedHomeGoals: 2,
        predictedAwayGoals: 1,
        actualHomeGoals: 2,
        actualAwayGoals: 1,
        status: 'exacto',
      },
    ])
  })

  it('marca como no_pronosticado un partido finalizado sin pronostico mio', async () => {
    const matches = [
      {
        id: 'match-2',
        kickoff_at: '2000-01-01T20:00:00Z',
        home_goals: 1,
        away_goals: 0,
        status: 'finished',
        home: { name: 'Danubio', alias: null, slug: 'danubio' },
        away: { name: 'Wanderers', alias: null, slug: 'wanderers' },
      },
    ]
    mockedFrom
      .mockReturnValueOnce({ select: mockMatchesQuery(matches).select } as never)
      .mockReturnValueOnce({ select: mockPredictionsQuery([]).select } as never)

    const result = await getMatchHistory('tournament-1', 'group-1', 'user-1')

    expect(result[0]).toMatchObject({ status: 'no_pronosticado', actualHomeGoals: 1, actualAwayGoals: 0 })
  })

  it('marca como por_definir un partido aun no jugado, tenga o no pronostico', async () => {
    const matches = [
      {
        id: 'match-3',
        kickoff_at: '2999-01-01T20:00:00Z',
        home_goals: null,
        away_goals: null,
        status: 'scheduled',
        home: { name: 'Cerro', alias: null, slug: 'cerro' },
        away: { name: 'Liverpool', alias: null, slug: 'liverpool' },
      },
    ]
    const predictions = [{ match_id: 'match-3', home_goals: 1, away_goals: 1, status: 'por_definir' }]
    mockedFrom
      .mockReturnValueOnce({ select: mockMatchesQuery(matches).select } as never)
      .mockReturnValueOnce({ select: mockPredictionsQuery(predictions).select } as never)

    const result = await getMatchHistory('tournament-1', 'group-1', 'user-1')

    expect(result[0]).toMatchObject({ status: 'por_definir', actualHomeGoals: null, actualAwayGoals: null })
  })

  it('propaga el error cuando falla la consulta de partidos', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValueOnce({ select } as never)

    await expect(getMatchHistory('tournament-1', 'group-1', 'user-1')).rejects.toThrow(
      'permission denied',
    )
  })
})
