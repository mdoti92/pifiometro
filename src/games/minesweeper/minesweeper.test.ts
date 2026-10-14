import { describe, expect, it } from 'vitest'
import {
  BOARD_SIZE,
  MINE_COUNT,
  createMinesweeper,
  minesLeft,
  reveal,
  stepMinesweeper,
  toggleFlag,
  type MinesweeperState,
} from './minesweeper'

function seeded(seed: number) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

function withMines(positions: [number, number][]): MinesweeperState {
  const state = createMinesweeper(Math.random)
  const cells = state.cells.map((row) => row.map((cell) => ({ ...cell })))
  for (const [x, y] of positions) cells[y][x].mine = true
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      let count = 0
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) if (cells[y + dy]?.[x + dx]?.mine && (dx || dy)) count++
      cells[y][x].adjacent = count
    }
  }
  return { ...state, cells, minesPlaced: true, phase: 'playing' }
}

describe('createMinesweeper', () => {
  it('arranca con 9x9 celdas tapadas, 10 minas por poner y el cronómetro en 0', () => {
    const state = createMinesweeper(Math.random)

    expect(state.cells).toHaveLength(BOARD_SIZE)
    expect(state.cells.flat().every((cell) => !cell.revealed && !cell.mine)).toBe(true)
    expect(minesLeft(state)).toBe(MINE_COUNT)
    expect(state.seconds).toBe(0)
  })
})

describe('primer destape', () => {
  it('pone 10 minas sin tocar la celda elegida ni sus vecinas y arranca el cronómetro', () => {
    for (let seed = 1; seed < 30; seed++) {
      const state = reveal(createMinesweeper(seeded(seed)), 4, 4, seeded(seed))
      const mines = state.cells.flat().filter((cell) => cell.mine)

      expect(mines).toHaveLength(MINE_COUNT)
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) expect(state.cells[4 + dy][4 + dx].mine).toBe(false)
      expect(state.phase).toBe('playing')
    }
  })
})

describe('reveal', () => {
  it('muestra la cantidad de minas vecinas', () => {
    const state = reveal(withMines([[0, 0], [8, 8]]), 1, 1, Math.random)

    expect(state.cells[1][1].revealed).toBe(true)
    expect(state.cells[1][1].adjacent).toBe(1)
  })

  it('si es 0 destapa en cascada las vecinas', () => {
    const state = reveal(withMines([[0, 0]]), 8, 8, Math.random)

    expect(state.cells[4][4].revealed).toBe(true)
    expect(state.cells[0][0].revealed).toBe(false)
  })

  it('no destapa una celda con bandera', () => {
    const flagged = toggleFlag(withMines([[0, 0]]), 3, 3)

    expect(reveal(flagged, 3, 3, Math.random).cells[3][3].revealed).toBe(false)
  })

  it('destapar una mina pierde: muestra todas las minas', () => {
    const state = reveal(withMines([[0, 0], [8, 8]]), 0, 0, Math.random)

    expect(state.phase).toBe('lost')
    expect(state.cells[8][8].revealed).toBe(true)
  })

  it('destapar todas las celdas sin mina gana', () => {
    const almost = reveal(withMines([[0, 0], [2, 0]]), 8, 8, Math.random)
    expect(almost.phase).toBe('playing')
    expect(almost.cells[0][1].revealed).toBe(false)

    expect(reveal(almost, 1, 0, Math.random).phase).toBe('won')
  })
})

describe('toggleFlag', () => {
  it('pone y saca banderas y descuenta del contador', () => {
    const flagged = toggleFlag(withMines([[0, 0]]), 2, 2)
    expect(flagged.cells[2][2].flagged).toBe(true)
    expect(minesLeft(flagged)).toBe(MINE_COUNT - 1)

    expect(toggleFlag(flagged, 2, 2).cells[2][2].flagged).toBe(false)
  })

  it('no pone bandera en una celda destapada', () => {
    const state = reveal(withMines([[0, 0], [8, 8]]), 1, 1, Math.random)

    expect(toggleFlag(state, 1, 1).cells[1][1].flagged).toBe(false)
  })
})

describe('cronómetro', () => {
  it('cuenta segundos solo mientras se está jugando', () => {
    const ready = createMinesweeper(Math.random)
    expect(stepMinesweeper(ready, undefined, Math.random).seconds).toBe(0)

    const playing = withMines([[0, 0]])
    expect(stepMinesweeper(playing, undefined, Math.random).seconds).toBe(1)

    const lost = reveal(playing, 0, 0, Math.random)
    expect(stepMinesweeper(lost, undefined, Math.random).seconds).toBe(0)
  })
})
