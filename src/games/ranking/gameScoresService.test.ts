import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../../lib/supabase'
import { fetchGameScores, submitGameResult } from './gameScoresService'

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

const mockedFrom = vi.mocked(supabase.from)

beforeEach(() => {
  vi.clearAllMocks()
})

function mockMyScore(bestValue: number | null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: bestValue === null ? null : { best_value: bestValue },
    error: null,
  })
  const eqGame = vi.fn().mockReturnValue({ maybeSingle })
  const eqUser = vi.fn().mockReturnValue({ eq: eqGame })
  const select = vi.fn().mockReturnValue({ eq: eqUser })
  const upsert = vi.fn().mockResolvedValue({ error: null })
  mockedFrom.mockReturnValue({ select, upsert } as never)
  return { upsert, eqUser, eqGame }
}

describe('fetchGameScores', () => {
  it('trae los puntajes del juego con el display_name de cada usuario', async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [{ user_id: 'u1', best_value: 12, achieved_at: '2026-10-01T00:00:00Z', profiles: { display_name: 'Doti' } }],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    const rows = await fetchGameScores('snake')

    expect(mockedFrom).toHaveBeenCalledWith('game_scores')
    expect(eq).toHaveBeenCalledWith('game_key', 'snake')
    expect(rows).toEqual([{ userId: 'u1', displayName: 'Doti', value: 12, achievedAt: '2026-10-01T00:00:00Z' }])
  })

  it('propaga el error de Supabase', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    mockedFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) } as never)

    await expect(fetchGameScores('snake')).rejects.toThrow('boom')
  })
})

describe('submitGameResult', () => {
  it('guarda el resultado si mejora la marca y lo devuelve', async () => {
    const { upsert, eqUser, eqGame } = mockMyScore(5)

    const best = await submitGameResult('u1', 'snake', 'highest', 9)

    expect(eqUser).toHaveBeenCalledWith('user_id', 'u1')
    expect(eqGame).toHaveBeenCalledWith('game_key', 'snake')
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', game_key: 'snake', best_value: 9 }),
      { onConflict: 'user_id,game_key' },
    )
    expect(best).toBe(9)
  })

  it('no toca la base si el resultado no mejora la marca', async () => {
    const { upsert } = mockMyScore(10)

    const best = await submitGameResult('u1', 'snake', 'highest', 9)

    expect(upsert).not.toHaveBeenCalled()
    expect(best).toBe(10)
  })

  it('en métrica cumulative suma el resultado a lo acumulado', async () => {
    const { upsert } = mockMyScore(3)

    const best = await submitGameResult('u1', 'pong', 'cumulative', 1)

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ best_value: 4 }), expect.anything())
    expect(best).toBe(4)
  })

  it('propaga el error si falla el guardado', async () => {
    const { upsert } = mockMyScore(null)
    upsert.mockResolvedValue({ error: { message: 'sin conexión' } })

    await expect(submitGameResult('u1', 'snake', 'highest', 3)).rejects.toThrow('sin conexión')
  })
})
