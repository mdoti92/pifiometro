import { describe, expect, it } from 'vitest'
import type { MatchdayGroup } from './groupMatchesByMatchday'
import { findLastFinishedMatchday } from './findLastFinishedMatchday'

interface Item {
  finished: boolean
}

function groups(entries: [number | null, boolean[]][]): MatchdayGroup<Item>[] {
  return entries.map(([matchday, finishedFlags]) => ({
    matchday,
    matches: finishedFlags.map((finished) => ({ finished })),
  }))
}

const isFinished = (item: Item) => item.finished

describe('findLastFinishedMatchday', () => {
  it('devuelve null cuando no hay grupos', () => {
    expect(findLastFinishedMatchday([], isFinished)).toBeNull()
  })

  it('devuelve null cuando ninguna fecha tiene partidos finalizados', () => {
    const g = groups([
      [1, [false, false]],
      [2, [false]],
    ])

    expect(findLastFinishedMatchday(g, isFinished)).toBeNull()
  })

  it('devuelve la fecha mas alta que tiene al menos un partido finalizado', () => {
    const g = groups([
      [1, [true, true]],
      [2, [true, false]],
      [3, [false]],
    ])

    expect(findLastFinishedMatchday(g, isFinished)).toBe(2)
  })

  it('ignora los grupos sin matchday asignado', () => {
    const g = groups([
      [1, [true]],
      [null, [true]],
    ])

    expect(findLastFinishedMatchday(g, isFinished)).toBe(1)
  })
})
