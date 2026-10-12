import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as groupMembersService from '../groups/groupMembersService'
import { supabase } from '../lib/supabase'
import {
  getGroupStageStandings,
  getGroupTournamentStandings,
  getMatchdaySummaries,
} from './standingsService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('../groups/groupMembersService', async () => {
  const actual =
    await vi.importActual<typeof import('../groups/groupMembersService')>(
      '../groups/groupMembersService',
    )
  return { ...actual, listMembers: vi.fn() }
})

const mockedFrom = vi.mocked(supabase.from)
const mockedListMembers = vi.mocked(groupMembersService.listMembers)

beforeEach(() => {
  vi.clearAllMocks()
})

function mockPredictionsQuery(rows: unknown[]) {
  const eq2 = vi.fn().mockResolvedValue({ data: rows, error: null })
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
  const select = vi.fn().mockReturnValue({ eq: eq1 })
  mockedFrom.mockReturnValue({ select } as never)
  return { select, eq1, eq2 }
}

describe('getGroupTournamentStandings', () => {
  it('ordena a los miembros de mayor a menor puntaje total', async () => {
    mockedListMembers.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01' },
      { userId: 'user-2', displayName: 'Aldo', role: 'member', joinedAt: '2026-01-01' },
    ])
    mockPredictionsQuery([
      { user_id: 'user-1', points: 3 },
      { user_id: 'user-1', points: 1 },
      { user_id: 'user-2', points: 3 },
      { user_id: 'user-2', points: 3 },
    ])

    const standings = await getGroupTournamentStandings('group-1', 'tournament-1')

    expect(standings).toEqual([
      { userId: 'user-2', displayName: 'Aldo', totalPoints: 6, rank: 1 },
      { userId: 'user-1', displayName: 'Doti', totalPoints: 4, rank: 2 },
    ])
  })

  it('incluye a los miembros sin pronosticos con 0 puntos', async () => {
    mockedListMembers.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01' },
      { userId: 'user-2', displayName: 'Aldo', role: 'member', joinedAt: '2026-01-01' },
    ])
    mockPredictionsQuery([{ user_id: 'user-1', points: 3 }])

    const standings = await getGroupTournamentStandings('group-1', 'tournament-1')

    expect(standings).toContainEqual({ userId: 'user-2', displayName: 'Aldo', totalPoints: 0, rank: 2 })
  })

  it('comparte el mismo puesto entre miembros empatados (competition ranking, sin desempate)', async () => {
    mockedListMembers.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01' },
      { userId: 'user-2', displayName: 'Aldo', role: 'member', joinedAt: '2026-01-01' },
      { userId: 'user-3', displayName: 'Vieja', role: 'member', joinedAt: '2026-01-01' },
    ])
    mockPredictionsQuery([
      { user_id: 'user-1', points: 5 },
      { user_id: 'user-2', points: 5 },
      { user_id: 'user-3', points: 2 },
    ])

    const standings = await getGroupTournamentStandings('group-1', 'tournament-1')

    expect(standings.map((row) => row.rank)).toEqual([1, 1, 3])
  })

  it('filtra la consulta de pronosticos por grupo y torneo', async () => {
    mockedListMembers.mockResolvedValue([])
    const { eq1, eq2 } = mockPredictionsQuery([])

    await getGroupTournamentStandings('group-1', 'tournament-1')

    expect(eq1).toHaveBeenCalledWith('group_id', 'group-1')
    expect(eq2).toHaveBeenCalledWith('matches.tournament_id', 'tournament-1')
  })

  it('propaga el error cuando falla la consulta de pronosticos', async () => {
    mockedListMembers.mockResolvedValue([])
    const eq2 = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const select = vi.fn().mockReturnValue({ eq: eq1 })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(getGroupTournamentStandings('group-1', 'tournament-1')).rejects.toThrow(
      'permission denied',
    )
  })
})

describe('getGroupStageStandings', () => {
  it('limita la tabla a los partidos de la etapa seleccionada', async () => {
    mockedListMembers.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01' },
      { userId: 'user-2', displayName: 'Aldo', role: 'member', joinedAt: '2026-01-01' },
    ])
    const { eq1, eq2 } = mockPredictionsQuery([
      { user_id: 'user-1', points: 3 },
      { user_id: 'user-2', points: 1 },
    ])

    const standings = await getGroupStageStandings('group-1', 'stage-1')

    expect(eq1).toHaveBeenCalledWith('group_id', 'group-1')
    expect(eq2).toHaveBeenCalledWith('matches.stage_id', 'stage-1')
    expect(standings).toEqual([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 3, rank: 1 },
      { userId: 'user-2', displayName: 'Aldo', totalPoints: 1, rank: 2 },
    ])
  })

  it('muestra la tabla vacia (todos en 0) sin error cuando la etapa no tiene partidos jugados', async () => {
    mockedListMembers.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01' },
    ])
    mockPredictionsQuery([])

    const standings = await getGroupStageStandings('group-1', 'stage-1')

    expect(standings).toEqual([{ userId: 'user-1', displayName: 'Doti', totalPoints: 0, rank: 1 }])
  })
})

function mockMatchdayPredictionsQuery(rows: unknown[]) {
  const notFn = vi.fn().mockResolvedValue({ data: rows, error: null })
  const eq2 = vi.fn().mockReturnValue({ not: notFn })
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
  const select = vi.fn().mockReturnValue({ eq: eq1 })
  mockedFrom.mockReturnValue({ select } as never)
  return { select, eq1, eq2, notFn }
}

describe('getMatchdaySummaries', () => {
  it('identifica la fecha con mas puntos como mejor fecha de cada usuario', async () => {
    mockedListMembers.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01' },
    ])
    mockMatchdayPredictionsQuery([
      { user_id: 'user-1', points: 1, matches: { matchday: 1 } },
      { user_id: 'user-1', points: 3, matches: { matchday: 2 } },
      { user_id: 'user-1', points: 1, matches: { matchday: 2 } },
    ])

    const summaries = await getMatchdaySummaries('group-1', 'tournament-1')

    expect(summaries).toContainEqual(
      expect.objectContaining({
        userId: 'user-1',
        bestMatchday: { matchday: 2, points: 4 },
      }),
    )
  })

  it('suma una fecha ganada a quien tiene el puntaje mas alto de esa fecha', async () => {
    mockedListMembers.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01' },
      { userId: 'user-2', displayName: 'Aldo', role: 'member', joinedAt: '2026-01-01' },
    ])
    mockMatchdayPredictionsQuery([
      { user_id: 'user-1', points: 3, matches: { matchday: 1 } },
      { user_id: 'user-2', points: 1, matches: { matchday: 1 } },
    ])

    const summaries = await getMatchdaySummaries('group-1', 'tournament-1')

    expect(summaries).toContainEqual(expect.objectContaining({ userId: 'user-1', matchdaysWon: 1 }))
    expect(summaries).toContainEqual(expect.objectContaining({ userId: 'user-2', matchdaysWon: 0 }))
  })

  it('cuenta la fecha como ganada para todos los empatados en el puntaje mas alto', async () => {
    mockedListMembers.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01' },
      { userId: 'user-2', displayName: 'Aldo', role: 'member', joinedAt: '2026-01-01' },
      { userId: 'user-3', displayName: 'Vieja', role: 'member', joinedAt: '2026-01-01' },
    ])
    mockMatchdayPredictionsQuery([
      { user_id: 'user-1', points: 3, matches: { matchday: 1 } },
      { user_id: 'user-2', points: 3, matches: { matchday: 1 } },
      { user_id: 'user-3', points: 1, matches: { matchday: 1 } },
    ])

    const summaries = await getMatchdaySummaries('group-1', 'tournament-1')

    expect(summaries).toContainEqual(expect.objectContaining({ userId: 'user-1', matchdaysWon: 1 }))
    expect(summaries).toContainEqual(expect.objectContaining({ userId: 'user-2', matchdaysWon: 1 }))
    expect(summaries).toContainEqual(expect.objectContaining({ userId: 'user-3', matchdaysWon: 0 }))
  })

  it('filtra por grupo, torneo y solo partidos con numero de fecha cargado', async () => {
    mockedListMembers.mockResolvedValue([])
    const { eq1, eq2, notFn } = mockMatchdayPredictionsQuery([])

    await getMatchdaySummaries('group-1', 'tournament-1')

    expect(eq1).toHaveBeenCalledWith('group_id', 'group-1')
    expect(eq2).toHaveBeenCalledWith('matches.tournament_id', 'tournament-1')
    expect(notFn).toHaveBeenCalledWith('matches.matchday', 'is', null)
  })

  it('devuelve bestMatchday null y matchdaysWon 0 para un usuario sin pronosticos con fecha cargada', async () => {
    mockedListMembers.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01' },
    ])
    mockMatchdayPredictionsQuery([])

    const summaries = await getMatchdaySummaries('group-1', 'tournament-1')

    expect(summaries).toEqual([
      { userId: 'user-1', displayName: 'Doti', bestMatchday: null, matchdaysWon: 0 },
    ])
  })
})
