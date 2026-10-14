import { describe, expect, it } from 'vitest'
import {
  FOUR_PROBABILITY,
  GRID_SIZE,
  WINNING_TILE,
  continuePlaying,
  create2048,
  slide,
  slideRow,
  type Grid,
  type Twenty48State,
} from './twenty48'

const first = () => 0

function state(grid: Grid, overrides: Partial<Twenty48State> = {}): Twenty48State {
  return { grid, score: 0, reachedWinningTile: false, keepPlaying: false, isOver: false, ...overrides }
}

function count(grid: Grid): number {
  return grid.flat().filter((value) => value > 0).length
}

describe('create2048', () => {
  it('arranca con una grilla de 4x4 y 2 fichas', () => {
    const initial = create2048(Math.random)

    expect(initial.grid).toHaveLength(GRID_SIZE)
    expect(count(initial.grid)).toBe(2)
    expect(initial.score).toBe(0)
  })
})

describe('slideRow', () => {
  it('desliza hasta el borde', () => {
    expect(slideRow([0, 2, 0, 4])).toEqual({ row: [2, 4, 0, 0], gained: 0 })
  })

  it('fusiona iguales contiguas sumando, una vez por ficha', () => {
    expect(slideRow([2, 2, 2, 2])).toEqual({ row: [4, 4, 0, 0], gained: 8 })
    expect(slideRow([4, 4, 8, 0])).toEqual({ row: [8, 8, 0, 0], gained: 8 })
    expect(slideRow([2, 2, 4, 0])).toEqual({ row: [4, 4, 0, 0], gained: 4 })
  })
})

describe('slide', () => {
  const grid: Grid = [
    [2, 0, 0, 2],
    [0, 0, 0, 0],
    [0, 4, 0, 0],
    [0, 4, 0, 0],
  ]

  it('mueve todas las fichas en la dirección, suma puntaje y agrega una ficha nueva', () => {
    const next = slide(state(grid), 'left', first)

    expect(next.grid[0][0]).toBe(4)
    expect(next.score).toBe(4)
    expect(count(next.grid)).toBe(count(slide(state(grid), 'left', () => 0.99).grid))
  })

  it('funciona en las cuatro direcciones', () => {
    expect(slide(state(grid), 'right', first).grid[0][3]).toBe(4)
    expect(slide(state(grid), 'down', first).grid[3][1]).toBe(8)
    expect(slide(state(grid), 'up', first).grid[0][1]).toBe(8)
  })

  it('la ficha nueva es 2 o, con baja probabilidad, 4', () => {
    const withTwo = slide(state(grid), 'left', () => FOUR_PROBABILITY)
    const withFour = slide(state(grid), 'left', () => 0)
    const newTiles = (g: Grid) => g.flat().filter((value) => value === 2 || value === 4)

    expect(newTiles(withTwo.grid)).toContain(2)
    expect(withFour.grid.flat()).toContain(4)
  })

  it('si el movimiento no cambia nada no aparece ficha nueva', () => {
    const stuck: Grid = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]

    expect(slide(state(stuck), 'left', first)).toEqual(state(stuck))
  })

  it('al formar la ficha ganadora lo marca y frena hasta que elija seguir', () => {
    const almost: Grid = [
      [WINNING_TILE / 2, WINNING_TILE / 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]

    const won = slide(state(almost), 'left', first)

    expect(won.reachedWinningTile).toBe(true)
    expect(slide(won, 'right', first)).toBe(won)
    expect(slide(continuePlaying(won), 'right', first)).not.toBe(won)
  })

  it('termina si la grilla queda llena y sin fusiones posibles', () => {
    const almostFull: Grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [8, 16, 8, 0],
    ]

    const next = slide(state(almostFull), 'right', () => FOUR_PROBABILITY / 2)

    expect(next.isOver).toBe(true)
  })
})
