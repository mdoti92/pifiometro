import { describe, expect, it } from 'vitest'
import { RANKING_TOP_SIZE, buildRanking, isBetter, mergeResult, type ScoreRow } from './rankingLogic'

function row(userId: string, value: number, achievedAt: string, displayName: string | null = userId): ScoreRow {
  return { userId, displayName, value, achievedAt }
}

describe('isBetter', () => {
  it('con métrica highest gana el mayor', () => {
    expect(isBetter('highest', 10, 5)).toBe(true)
    expect(isBetter('highest', 5, 10)).toBe(false)
    expect(isBetter('highest', 5, 5)).toBe(false)
  })

  it('con métrica lowest gana el menor', () => {
    expect(isBetter('lowest', 30, 45)).toBe(true)
    expect(isBetter('lowest', 45, 30)).toBe(false)
  })

  it('cualquier valor es mejor que no tener marca', () => {
    expect(isBetter('lowest', 999, null)).toBe(true)
    expect(isBetter('highest', 0, null)).toBe(true)
  })
})

describe('mergeResult', () => {
  it('en highest/lowest devuelve el nuevo valor solo si mejora la marca', () => {
    expect(mergeResult('highest', 5, 8)).toBe(8)
    expect(mergeResult('highest', 8, 5)).toBeNull()
    expect(mergeResult('lowest', 40, 30)).toBe(30)
    expect(mergeResult('lowest', null, 30)).toBe(30)
  })

  it('en cumulative suma el resultado a lo acumulado', () => {
    expect(mergeResult('cumulative', 3, 1)).toBe(4)
    expect(mergeResult('cumulative', null, 1)).toBe(1)
  })

  it('en cumulative un resultado 0 no cambia nada', () => {
    expect(mergeResult('cumulative', 3, 0)).toBeNull()
  })
})

describe('buildRanking', () => {
  it('ordena de mayor a menor con métrica highest y numera posiciones', () => {
    const ranking = buildRanking('highest', [row('a', 5, '2026-01-01'), row('b', 9, '2026-01-01')], 'a')

    expect(ranking.top.map((entry) => [entry.position, entry.userId])).toEqual([
      [1, 'b'],
      [2, 'a'],
    ])
  })

  it('ordena de menor a mayor con métrica lowest', () => {
    const ranking = buildRanking('lowest', [row('a', 50, '2026-01-01'), row('b', 30, '2026-01-01')], null)

    expect(ranking.top.map((entry) => entry.userId)).toEqual(['b', 'a'])
  })

  it('a igual marca queda arriba el que la logró primero', () => {
    const ranking = buildRanking(
      'highest',
      [row('tarde', 7, '2026-03-02T10:00:00Z'), row('temprano', 7, '2026-03-01T10:00:00Z')],
      null,
    )

    expect(ranking.top.map((entry) => entry.userId)).toEqual(['temprano', 'tarde'])
  })

  it('corta en el top y marca al usuario actual si está adentro', () => {
    const rows = Array.from({ length: RANKING_TOP_SIZE + 3 }, (_, index) => row(`u${index}`, 100 - index, '2026-01-01'))

    const ranking = buildRanking('highest', rows, 'u2')

    expect(ranking.top).toHaveLength(RANKING_TOP_SIZE)
    expect(ranking.top[2].isCurrentUser).toBe(true)
    expect(ranking.currentUserOutsideTop).toBeNull()
  })

  it('si el usuario actual quedó fuera del top devuelve su posición aparte', () => {
    const rows = Array.from({ length: RANKING_TOP_SIZE + 3 }, (_, index) => row(`u${index}`, 100 - index, '2026-01-01'))

    const ranking = buildRanking('highest', rows, `u${RANKING_TOP_SIZE + 1}`)

    expect(ranking.currentUserOutsideTop).toMatchObject({ position: RANKING_TOP_SIZE + 2, isCurrentUser: true })
  })

  it('sin puntajes devuelve un ranking vacío', () => {
    expect(buildRanking('highest', [], 'a')).toEqual({ top: [], currentUserOutsideTop: null })
  })
})
