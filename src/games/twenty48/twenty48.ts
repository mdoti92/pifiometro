import type { SwipeDirection } from '../shared/input'
import type { RandomSource } from '../shared/useGameLoop'

export const GRID_SIZE = 4
export const WINNING_TILE = 2048
/** Probabilidad de que la ficha nueva sea un 4 en vez de un 2. */
export const FOUR_PROBABILITY = 0.1
const INITIAL_TILES = 2

export type Grid = number[][]

export interface Twenty48State {
  grid: Grid
  score: number
  reachedWinningTile: boolean
  keepPlaying: boolean
  isOver: boolean
}

function emptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array<number>(GRID_SIZE).fill(0))
}

function addRandomTile(grid: Grid, random: RandomSource): Grid {
  const empty: [number, number][] = []
  grid.forEach((row, y) => row.forEach((value, x) => value === 0 && empty.push([x, y])))
  if (empty.length === 0) return grid

  const [x, y] = empty[Math.floor(random() * empty.length)]
  const next = grid.map((row) => [...row])
  next[y][x] = random() < FOUR_PROBABILITY ? 4 : 2
  return next
}

export function create2048(random: RandomSource): Twenty48State {
  let grid = emptyGrid()
  for (let i = 0; i < INITIAL_TILES; i++) grid = addRandomTile(grid, random)
  return { grid, score: 0, reachedWinningTile: false, keepPlaying: false, isOver: false }
}

/** Desliza una fila hacia el inicio; cada ficha se fusiona como máximo una vez. */
export function slideRow(row: number[]): { row: number[]; gained: number } {
  const tiles = row.filter((value) => value > 0)
  const result: number[] = []
  let gained = 0
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === tiles[i + 1]) {
      result.push(tiles[i] * 2)
      gained += tiles[i] * 2
      i++
    } else {
      result.push(tiles[i])
    }
  }
  while (result.length < GRID_SIZE) result.push(0)
  return { row: result, gained }
}

function transpose(grid: Grid): Grid {
  return grid[0].map((_, x) => grid.map((row) => row[x]))
}

function slideGrid(grid: Grid, direction: SwipeDirection): { grid: Grid; gained: number } {
  const vertical = direction === 'up' || direction === 'down'
  const reversed = direction === 'right' || direction === 'down'
  const lines = vertical ? transpose(grid) : grid

  let gained = 0
  const slid = lines.map((line) => {
    const oriented = reversed ? [...line].reverse() : line
    const result = slideRow(oriented)
    gained += result.gained
    return reversed ? result.row.reverse() : result.row
  })

  return { grid: vertical ? transpose(slid) : slid, gained }
}

function sameGrid(a: Grid, b: Grid): boolean {
  return a.every((row, y) => row.every((value, x) => value === b[y][x]))
}

function canMove(grid: Grid): boolean {
  return grid.some((row, y) =>
    row.some((value, x) => value === 0 || value === row[x + 1] || value === grid[y + 1]?.[x]),
  )
}

export function slide(state: Twenty48State, direction: SwipeDirection, random: RandomSource): Twenty48State {
  if (state.isOver || (state.reachedWinningTile && !state.keepPlaying)) return state

  const { grid: slid, gained } = slideGrid(state.grid, direction)
  if (sameGrid(slid, state.grid)) return state

  const grid = addRandomTile(slid, random)
  return {
    ...state,
    grid,
    score: state.score + gained,
    reachedWinningTile: state.reachedWinningTile || grid.flat().includes(WINNING_TILE),
    isOver: !canMove(grid),
  }
}

export function continuePlaying(state: Twenty48State): Twenty48State {
  return { ...state, keepPlaying: true }
}

export function showsWinMessage(state: Twenty48State): boolean {
  return state.reachedWinningTile && !state.keepPlaying
}
