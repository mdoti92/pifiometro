import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import {
  getMatch,
  getPrediction,
  hasKickedOff,
  InvalidGoalsError,
  savePrediction,
} from './predictionsService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockedFrom = vi.mocked(supabase.from)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getPrediction', () => {
  it('devuelve el pronostico guardado del usuario para ese partido y grupo', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { home_goals: 2, away_goals: 1 },
      error: null,
    })
    const eq3 = vi.fn().mockReturnValue({ maybeSingle })
    const eq2 = vi.fn().mockReturnValue({ eq: eq3 })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const select = vi.fn().mockReturnValue({ eq: eq1 })
    mockedFrom.mockReturnValue({ select } as never)

    const prediction = await getPrediction('match-1', 'group-1', 'user-1')

    expect(mockedFrom).toHaveBeenCalledWith('predictions')
    expect(eq1).toHaveBeenCalledWith('match_id', 'match-1')
    expect(eq2).toHaveBeenCalledWith('group_id', 'group-1')
    expect(eq3).toHaveBeenCalledWith('user_id', 'user-1')
    expect(prediction).toEqual({ homeGoals: 2, awayGoals: 1 })
  })

  it('devuelve null cuando todavia no cargue un pronostico', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq3 = vi.fn().mockReturnValue({ maybeSingle })
    const eq2 = vi.fn().mockReturnValue({ eq: eq3 })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const select = vi.fn().mockReturnValue({ eq: eq1 })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(getPrediction('match-1', 'group-1', 'user-1')).resolves.toBeNull()
  })
})

describe('savePrediction', () => {
  const validInput = { matchId: 'match-1', groupId: 'group-1', userId: 'user-1', homeGoals: 2, awayGoals: 1 }

  it('guarda el pronostico asociado al usuario, partido y grupo', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    mockedFrom.mockReturnValue({ upsert } as never)

    await savePrediction(validInput)

    expect(mockedFrom).toHaveBeenCalledWith('predictions')
    expect(upsert).toHaveBeenCalledWith(
      { match_id: 'match-1', group_id: 'group-1', user_id: 'user-1', home_goals: 2, away_goals: 1 },
      { onConflict: 'match_id,group_id,user_id' },
    )
  })

  it.each([
    [-1, 1],
    [1, -1],
    [1.5, 1],
    [1, Number.NaN],
  ])('lanza InvalidGoalsError sin llamar a supabase para %i-%i', async (homeGoals, awayGoals) => {
    await expect(
      savePrediction({ ...validInput, homeGoals, awayGoals }),
    ).rejects.toThrow(InvalidGoalsError)
    expect(mockedFrom).not.toHaveBeenCalled()
  })

  it('propaga el error cuando el partido ya arranco (RLS lo rechaza)', async () => {
    const upsert = vi.fn().mockResolvedValue({
      error: { message: 'new row violates row-level security policy' },
    })
    mockedFrom.mockReturnValue({ upsert } as never)

    await expect(savePrediction(validInput)).rejects.toThrow(
      'new row violates row-level security policy',
    )
  })
})

describe('getMatch', () => {
  it('devuelve los datos del partido', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'match-1',
        kickoff_at: '2026-03-01T20:00:00Z',
        home: { name: 'Nacional', alias: null, slug: 'nacional' },
        away: { name: 'Peñarol', alias: null, slug: 'penarol' },
      },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    const match = await getMatch('match-1')

    expect(mockedFrom).toHaveBeenCalledWith('matches')
    expect(eq).toHaveBeenCalledWith('id', 'match-1')
    expect(match).toEqual({
      id: 'match-1',
      homeTeam: 'Nacional',
      awayTeam: 'Peñarol',
      homeTeamSlug: 'nacional',
      awayTeamSlug: 'penarol',
      kickoffAt: '2026-03-01T20:00:00Z',
    })
  })

  it('propaga el error cuando el partido no existe', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'no rows found' } })
    const eq = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(getMatch('match-inexistente')).rejects.toThrow('no rows found')
  })
})

describe('hasKickedOff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T20:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('devuelve true cuando la hora de kickoff ya paso', () => {
    expect(hasKickedOff('2026-03-01T19:59:59Z')).toBe(true)
  })

  it('devuelve true cuando la hora de kickoff es exactamente ahora', () => {
    expect(hasKickedOff('2026-03-01T20:00:00Z')).toBe(true)
  })

  it('devuelve false cuando la hora de kickoff todavia no llego', () => {
    expect(hasKickedOff('2026-03-01T20:00:01Z')).toBe(false)
  })
})
