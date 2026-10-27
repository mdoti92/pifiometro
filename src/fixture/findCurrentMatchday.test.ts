import { describe, expect, it } from 'vitest'
import type { MatchdayGroup } from './groupMatchesByMatchday'
import { findCurrentMatchday } from './findCurrentMatchday'

interface Item {
  pending: boolean
}

function groups(entries: [number | null, boolean[]][]): MatchdayGroup<Item>[] {
  return entries.map(([matchday, pendingFlags]) => ({
    matchday,
    matches: pendingFlags.map((pending) => ({ pending })),
  }))
}

const isPending = (item: Item) => item.pending

describe('findCurrentMatchday', () => {
  it('devuelve null cuando no hay grupos', () => {
    expect(findCurrentMatchday([], isPending)).toBeNull()
  })

  it('devuelve la primera fecha cuando no se jugo ningun partido', () => {
    const g = groups([
      [1, [true, true]],
      [2, [true]],
    ])

    expect(findCurrentMatchday(g, isPending)).toBe(1)
  })

  it('se queda en la fecha que se esta jugando mientras le queden partidos por jugar', () => {
    const g = groups([
      [1, [false, false]],
      [2, [false, true]],
      [3, [true]],
    ])

    expect(findCurrentMatchday(g, isPending)).toBe(2)
  })

  it('pasa a la fecha siguiente cuando se jugaron todos los partidos de la anterior', () => {
    const g = groups([
      [1, [false, false]],
      [2, [false, false]],
      [3, [true, true]],
    ])

    expect(findCurrentMatchday(g, isPending)).toBe(3)
  })

  it('devuelve la ultima fecha cuando ya se jugaron todas', () => {
    const g = groups([
      [1, [false]],
      [2, [false]],
    ])

    expect(findCurrentMatchday(g, isPending)).toBe(2)
  })

  it('ignora los grupos sin matchday asignado', () => {
    const g = groups([
      [1, [false]],
      [null, [true]],
    ])

    expect(findCurrentMatchday(g, isPending)).toBe(1)
  })
})
