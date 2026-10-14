import type { RandomSource } from '../shared/useGameLoop'

export const BOARD_COLUMNS = 10
export const BOARD_ROWS = 20
export const LINES_PER_LEVEL = 10
/** Puntos por cantidad de filas borradas a la vez (0 a 4), multiplicados por el nivel. */
export const LINE_SCORES = [0, 40, 100, 300, 1200]
export const LEVEL_INTERVALS_MS = [800, 680, 560, 450, 360, 290, 230, 180, 140, 110]

export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const
export type PieceType = (typeof PIECE_TYPES)[number]

type Cell = [number, number]

// Forma en su caja de rotación (lado = size), en la posición inicial.
const SHAPES: Record<PieceType, { size: number; cells: Cell[] }> = {
  I: { size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  O: { size: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  T: { size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { size: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { size: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  J: { size: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  L: { size: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
}

const ROTATIONS = 4

export type Board = boolean[][]

export interface Piece {
  type: PieceType
  rotation: number
  x: number
  y: number
}

export interface TetrisState {
  board: Board
  piece: Piece
  next: PieceType
  score: number
  lines: number
  level: number
  isOver: boolean
}

function randomType(random: RandomSource): PieceType {
  return PIECE_TYPES[Math.floor(random() * PIECE_TYPES.length)]
}

function spawn(type: PieceType): Piece {
  return { type, rotation: 0, x: Math.floor((BOARD_COLUMNS - SHAPES[type].size) / 2), y: 0 }
}

/** Celdas absolutas que ocupa la pieza en el tablero. */
export function pieceCells(piece: Piece): Cell[] {
  const { size, cells } = SHAPES[piece.type]
  return cells.map(([cellX, cellY]) => {
    let [x, y] = [cellX, cellY]
    for (let turn = 0; turn < piece.rotation; turn++) [x, y] = [size - 1 - y, x]
    return [piece.x + x, piece.y + y]
  })
}

function fits(board: Board, piece: Piece): boolean {
  return pieceCells(piece).every(
    ([x, y]) => x >= 0 && x < BOARD_COLUMNS && y >= 0 && y < BOARD_ROWS && !board[y][x],
  )
}

function emptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () => Array<boolean>(BOARD_COLUMNS).fill(false))
}

export function createTetris(random: RandomSource): TetrisState {
  return {
    board: emptyBoard(),
    piece: spawn(randomType(random)),
    next: randomType(random),
    score: 0,
    lines: 0,
    level: 1,
    isOver: false,
  }
}

export function move(state: TetrisState, deltaX: -1 | 1): TetrisState {
  const moved = { ...state.piece, x: state.piece.x + deltaX }
  return fits(state.board, moved) ? { ...state, piece: moved } : state
}

export function rotate(state: TetrisState): TetrisState {
  const rotated = { ...state.piece, rotation: (state.piece.rotation + 1) % ROTATIONS }
  return fits(state.board, rotated) ? { ...state, piece: rotated } : state
}

function lockPiece(state: TetrisState, random: RandomSource): TetrisState {
  const board = state.board.map((row) => [...row])
  for (const [x, y] of pieceCells(state.piece)) board[y][x] = true

  const remaining = board.filter((row) => !row.every(Boolean))
  const cleared = BOARD_ROWS - remaining.length
  const refilled = [...Array.from({ length: cleared }, () => Array<boolean>(BOARD_COLUMNS).fill(false)), ...remaining]

  const lines = state.lines + cleared
  const piece = spawn(state.next)

  return {
    board: refilled,
    piece,
    next: randomType(random),
    score: state.score + LINE_SCORES[cleared] * state.level,
    lines,
    level: 1 + Math.floor(lines / LINES_PER_LEVEL),
    isOver: !fits(refilled, piece),
  }
}

export function stepTetris(state: TetrisState, _input: undefined, random: RandomSource): TetrisState {
  if (state.isOver) return state
  const lowered = { ...state.piece, y: state.piece.y + 1 }
  return fits(state.board, lowered) ? { ...state, piece: lowered } : lockPiece(state, random)
}

export function hardDrop(state: TetrisState, random: RandomSource): TetrisState {
  let piece = state.piece
  while (fits(state.board, { ...piece, y: piece.y + 1 })) piece = { ...piece, y: piece.y + 1 }
  return lockPiece({ ...state, piece }, random)
}

export function intervalFor(state: TetrisState): number {
  return LEVEL_INTERVALS_MS[Math.min(state.level - 1, LEVEL_INTERVALS_MS.length - 1)]
}

/** Celdas de una pieza en su caja, para dibujar la próxima. */
export function previewCells(type: PieceType): Cell[] {
  return SHAPES[type].cells
}
