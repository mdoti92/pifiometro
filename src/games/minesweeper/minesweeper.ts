import type { RandomSource } from '../shared/useGameLoop'

export const BOARD_SIZE = 9
export const MINE_COUNT = 10
export const TIMER_INTERVAL_MS = 1000

export interface MineCell {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

/** ready: todavía no se destapó nada (las minas se ponen en el primer destape). */
export type MinesweeperPhase = 'ready' | 'playing' | 'won' | 'lost'

export interface MinesweeperState {
  cells: MineCell[][]
  minesPlaced: boolean
  phase: MinesweeperPhase
  seconds: number
}

type Position = [number, number]

function neighbors(x: number, y: number): Position[] {
  const result: Position[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx
      const ny = y + dy
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < BOARD_SIZE && ny < BOARD_SIZE) result.push([nx, ny])
    }
  }
  return result
}

function copyCells(cells: MineCell[][]): MineCell[][] {
  return cells.map((row) => row.map((cell) => ({ ...cell })))
}

export function createMinesweeper(_random: RandomSource): MinesweeperState {
  const cells = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 })),
  )
  return { cells, minesPlaced: false, phase: 'ready', seconds: 0 }
}

function placeMines(cells: MineCell[][], safeX: number, safeY: number, random: RandomSource): MineCell[][] {
  const placed = copyCells(cells)
  const forbidden = new Set([[safeX, safeY], ...neighbors(safeX, safeY)].map(([x, y]) => `${x},${y}`))
  const candidates: Position[] = []
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) if (!forbidden.has(`${x},${y}`)) candidates.push([x, y])
  }

  for (let i = 0; i < MINE_COUNT; i++) {
    const index = Math.floor(random() * candidates.length)
    const [x, y] = candidates.splice(index, 1)[0]
    placed[y][x].mine = true
  }

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      placed[y][x].adjacent = neighbors(x, y).filter(([nx, ny]) => placed[ny][nx].mine).length
    }
  }
  return placed
}

function allSafeRevealed(cells: MineCell[][]): boolean {
  return cells.flat().every((cell) => cell.mine || cell.revealed)
}

export function reveal(state: MinesweeperState, x: number, y: number, random: RandomSource): MinesweeperState {
  if (state.phase === 'won' || state.phase === 'lost') return state
  if (state.cells[y][x].flagged || state.cells[y][x].revealed) return state

  const cells = state.minesPlaced ? copyCells(state.cells) : placeMines(state.cells, x, y, random)

  if (cells[y][x].mine) {
    for (const cell of cells.flat()) if (cell.mine) cell.revealed = true
    return { ...state, cells, minesPlaced: true, phase: 'lost' }
  }

  const pending: Position[] = [[x, y]]
  while (pending.length > 0) {
    const [cx, cy] = pending.pop() as Position
    const cell = cells[cy][cx]
    if (cell.revealed || cell.flagged) continue
    cell.revealed = true
    if (cell.adjacent === 0) pending.push(...neighbors(cx, cy))
  }

  return { ...state, cells, minesPlaced: true, phase: allSafeRevealed(cells) ? 'won' : 'playing' }
}

export function toggleFlag(state: MinesweeperState, x: number, y: number): MinesweeperState {
  if (state.phase === 'won' || state.phase === 'lost' || state.cells[y][x].revealed) return state
  const cells = copyCells(state.cells)
  cells[y][x].flagged = !cells[y][x].flagged
  return { ...state, cells }
}

export function minesLeft(state: MinesweeperState): number {
  return MINE_COUNT - state.cells.flat().filter((cell) => cell.flagged).length
}

export function stepMinesweeper(state: MinesweeperState, _input: undefined, _random: RandomSource): MinesweeperState {
  return state.phase === 'playing' ? { ...state, seconds: state.seconds + 1 } : state
}

export function isFinished(state: MinesweeperState): boolean {
  return state.phase === 'won' || state.phase === 'lost'
}
