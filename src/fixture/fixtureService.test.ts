import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { listTournamentFixture } from './fixtureService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockedFrom = vi.mocked(supabase.from)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listTournamentFixture', () => {
  it('lista los partidos del torneo ordenados por kickoff, resolviendo alias y slug de cada equipo', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'match-1',
          kickoff_at: '2026-03-01T20:00:00Z',
          matchday: 1,
          status: 'finished',
          home_goals: 2,
          away_goals: 1,
          is_elimination: false,
          went_to_penalties: false,
          home_goals_penalties: null,
          away_goals_penalties: null,
          home: { name: 'Nacional', alias: null, slug: 'nacional' },
          away: { name: 'Peñarol', alias: null, slug: 'penarol' },
        },
      ],
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    const fixture = await listTournamentFixture('tournament-1')

    expect(mockedFrom).toHaveBeenCalledWith('matches')
    expect(eq).toHaveBeenCalledWith('tournament_id', 'tournament-1')
    expect(fixture).toEqual([
      {
        id: 'match-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        homeTeamSlug: 'nacional',
        awayTeamSlug: 'penarol',
        kickoffAt: '2026-03-01T20:00:00Z',
        matchday: 1,
        status: 'finished',
        homeGoals: 2,
        awayGoals: 1,
        isElimination: false,
        wentToPenalties: false,
        homeGoalsPenalties: null,
        awayGoalsPenalties: null,
      },
    ])
  })

  it('usa el alias del equipo cuando esta cargado', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'match-1',
          kickoff_at: '2026-03-01T20:00:00Z',
          matchday: 1,
          status: 'scheduled',
          home_goals: null,
          away_goals: null,
          is_elimination: false,
          went_to_penalties: false,
          home_goals_penalties: null,
          away_goals_penalties: null,
          home: { name: 'Danubio', alias: 'Diluvio', slug: 'danubio' },
          away: { name: 'Wanderers', alias: null, slug: 'wanderers' },
        },
      ],
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    const fixture = await listTournamentFixture('tournament-1')

    expect(fixture[0].homeTeam).toBe('Diluvio')
    expect(fixture[0].awayTeam).toBe('Wanderers')
  })

  it('propaga el error de supabase', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(listTournamentFixture('tournament-1')).rejects.toThrow('permission denied')
  })
})
