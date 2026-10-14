import { describe, expect, it } from 'vitest'
import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  LEVEL_INTERVALS_MS,
  LINES_PER_LEVEL,
  LINE_SCORES,
  PIECE_TYPES,
  createTetris,
  hardDrop,
  intervalFor,
  move,
  pieceCells,
  rotate,
  stepTetris,
  type Board,
  type TetrisState,
} from './tetris'

const first = () => 0

function emptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLUMNS).fill(false))
}

function withPiece(state: TetrisState, type: TetrisState['piece']['type'], x: number, y: number): TetrisState {
  return { ...state, piece: { type, rotation: 0, x, y } }
}

describe('createTetris', () => {
  it('arranca con tablero vacío de 10x20, una pieza de las 7 clásicas y la próxima', () => {
    const state = createTetris(first)

    expect(state.board).toHaveLength(BOARD_ROWS)
    expect(state.board[0]).toHaveLength(BOARD_COLUMNS)
    expect(PIECE_TYPES).toEqual(['I', 'O', 'T', 'S', 'Z', 'J', 'L'])
    expect(PIECE_TYPES).toContain(state.piece.type)
    expect(PIECE_TYPES).toContain(state.next)
    expect(state.level).toBe(1)
  })
})

describe('move', () => {
  it('mueve una columna si no choca', () => {
    const state = withPiece(createTetris(first), 'O', 4, 0)

    expect(move(state, 1).piece.x).toBe(5)
    expect(move(state, -1).piece.x).toBe(3)
  })

  it('no atraviesa las paredes', () => {
    const state = withPiece(createTetris(first), 'O', 0, 0)

    expect(move(state, -1).piece.x).toBe(0)
  })

  it('no atraviesa bloques fijos', () => {
    const board = emptyBoard()
    board[0][6] = true
    board[1][6] = true
    const state = { ...withPiece(createTetris(first), 'O', 4, 0), board }

    expect(move(state, 1).piece.x).toBe(4)
  })
})

describe('rotate', () => {
  it('rota 90° en sentido horario', () => {
    const state = withPiece(createTetris(first), 'T', 3, 5)

    const rotated = rotate(state)

    expect(rotated.piece.rotation).toBe(1)
    expect(pieceCells(rotated.piece)).not.toEqual(pieceCells(state.piece))
  })

  it('no rota si chocaría con la pared', () => {
    const vertical = rotate(withPiece(createTetris(first), 'I', 0, 5))
    const againstWall = { ...vertical, piece: { ...vertical.piece, x: -2 } }
    expect(pieceCells(againstWall.piece).every(([x]) => x >= 0)).toBe(true)

    expect(rotate(againstWall).piece).toEqual(againstWall.piece)
  })
})

describe('caída', () => {
  it('cada paso baja la pieza una fila', () => {
    const state = withPiece(createTetris(first), 'O', 4, 3)

    expect(stepTetris(state, undefined, first).piece.y).toBe(4)
  })

  it('al apoyarse queda fija y aparece la próxima pieza', () => {
    const state = withPiece(createTetris(first), 'O', 4, BOARD_ROWS - 2)

    const next = stepTetris(state, undefined, first)

    expect(next.board[BOARD_ROWS - 1][4]).toBe(true)
    expect(next.board[BOARD_ROWS - 1][5]).toBe(true)
    expect(next.piece.type).toBe(state.next)
  })

  it('hard drop la lleva a lo más bajo y la fija en el momento', () => {
    const state = withPiece(createTetris(first), 'O', 4, 0)

    const dropped = hardDrop(state, first)

    expect(dropped.board[BOARD_ROWS - 1][4]).toBe(true)
    expect(dropped.board[BOARD_ROWS - 2][5]).toBe(true)
    expect(dropped.piece.y).toBeLessThan(2)
  })
})

describe('líneas', () => {
  it('borra filas completas, baja lo de arriba y suma según cuántas fueron', () => {
    const board = emptyBoard()
    for (let x = 0; x < BOARD_COLUMNS; x++) {
      if (x === 4 || x === 5) continue
      board[BOARD_ROWS - 1][x] = true
      board[BOARD_ROWS - 2][x] = true
    }
    board[BOARD_ROWS - 3][0] = true
    const state = { ...withPiece(createTetris(first), 'O', 4, 0), board }

    const next = hardDrop(state, first)

    expect(next.lines).toBe(2)
    expect(next.score).toBe(LINE_SCORES[2])
    expect(next.board[BOARD_ROWS - 1][0]).toBe(true)
    expect(next.board[BOARD_ROWS - 1].filter(Boolean)).toHaveLength(1)
  })

  it('cada 10 líneas sube el nivel y las piezas caen más rápido', () => {
    const state = { ...createTetris(first), lines: LINES_PER_LEVEL - 1 }
    const board = emptyBoard()
    for (let x = 0; x < BOARD_COLUMNS; x++) if (x !== 4 && x !== 5) board[BOARD_ROWS - 1][x] = true

    const next = hardDrop({ ...withPiece(state, 'O', 4, 0), board }, first)

    expect(next.level).toBe(2)
    expect(intervalFor(next)).toBe(LEVEL_INTERVALS_MS[1])
    expect(intervalFor(next)).toBeLessThan(intervalFor(state))
  })
})

describe('game over', () => {
  it('termina si la pieza nueva no tiene lugar para aparecer', () => {
    const board = emptyBoard()
    for (let y = 0; y < BOARD_ROWS; y++) {
      for (let x = 0; x < BOARD_COLUMNS - 1; x++) board[y][x] = y >= 2 || x >= 3
    }
    const state = { ...withPiece(createTetris(first), 'O', 0, 0), board }

    expect(hardDrop(state, first).isOver).toBe(true)
  })
})
