import { describe, expect, it } from 'vitest'
import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  FOOD_POINTS,
  INITIAL_SNAKE_LENGTH,
  createInitialState,
  queueDirection,
  spawnFood,
  tick,
  type GameState,
} from './snakeGame'

const alwaysFirst = () => 0

function stateWith(overrides: Partial<GameState>): GameState {
  return { ...createInitialState(alwaysFirst), ...overrides }
}

describe('createInitialState', () => {
  it('arranca con una víbora de 3 segmentos moviéndose hacia la derecha', () => {
    const state = createInitialState(alwaysFirst)

    expect(state.snake).toHaveLength(INITIAL_SNAKE_LENGTH)
    expect(state.direction).toBe('right')
    expect(state.score).toBe(0)
  })

  it('arma la víbora horizontal con la cabeza adelante', () => {
    const [head, middle, tail] = createInitialState(alwaysFirst).snake

    expect(middle).toEqual({ x: head.x - 1, y: head.y })
    expect(tail).toEqual({ x: head.x - 2, y: head.y })
  })

  it('no pone la comida encima de la víbora', () => {
    const state = createInitialState(alwaysFirst)

    expect(state.snake).not.toContainEqual(state.food)
  })
})

describe('tick', () => {
  it('mueve la cabeza una celda en la dirección actual y la cola la sigue', () => {
    const state = stateWith({
      snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
      food: { x: 0, y: 0 },
    })

    const next = tick(state, alwaysFirst)

    expect(next.snake).toEqual([{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }])
  })

  it('aplica la dirección encolada en el tick', () => {
    const state = queueDirection(
      stateWith({ snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], food: { x: 0, y: 0 } }),
      'up',
    )

    const next = tick(state, alwaysFirst)

    expect(next.direction).toBe('up')
    expect(next.snake[0]).toEqual({ x: 5, y: 4 })
    expect(next.pendingDirection).toBeNull()
  })

  it('al salir por el borde derecho reaparece por el izquierdo', () => {
    const state = stateWith({
      snake: [{ x: BOARD_COLUMNS - 1, y: 2 }, { x: BOARD_COLUMNS - 2, y: 2 }, { x: BOARD_COLUMNS - 3, y: 2 }],
      food: { x: 5, y: 5 },
    })

    expect(tick(state, alwaysFirst).snake[0]).toEqual({ x: 0, y: 2 })
  })

  it('al salir por el borde superior reaparece por el inferior', () => {
    const state = stateWith({
      snake: [{ x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }],
      direction: 'up',
      food: { x: 5, y: 5 },
    })

    expect(tick(state, alwaysFirst).snake[0]).toEqual({ x: 3, y: BOARD_ROWS - 1 })
  })

  it('al comer crece un segmento, suma puntos y aparece comida nueva libre', () => {
    const state = stateWith({
      snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
      food: { x: 6, y: 5 },
    })

    const next = tick(state, alwaysFirst)

    expect(next.snake).toEqual([{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }])
    expect(next.score).toBe(FOOD_POINTS)
    expect(next.snake).not.toContainEqual(next.food)
  })

  it('termina la partida si la cabeza choca contra el cuerpo', () => {
    const state = stateWith({
      snake: [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }],
      direction: 'down',
      food: { x: 0, y: 0 },
    })

    expect(tick(state, alwaysFirst).isOver).toBe(true)
  })

  it('no choca contra la punta de la cola porque se corre en el mismo tick', () => {
    const state = stateWith({
      snake: [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }],
      direction: 'down',
      food: { x: 0, y: 0 },
    })

    expect(tick(state, alwaysFirst).isOver).toBe(false)
  })

  it('no avanza una partida terminada', () => {
    const state = stateWith({ isOver: true })

    expect(tick(state, alwaysFirst)).toBe(state)
  })
})

describe('queueDirection', () => {
  it('ignora la dirección opuesta a la actual', () => {
    const state = stateWith({ direction: 'right' })

    expect(queueDirection(state, 'left').pendingDirection).toBeNull()
  })

  it('ignora la misma dirección que la actual', () => {
    const state = stateWith({ direction: 'right' })

    expect(queueDirection(state, 'right').pendingDirection).toBeNull()
  })

  it('solo aplica el primer cambio válido dentro del mismo tick', () => {
    const state = stateWith({ direction: 'right' })

    const queued = queueDirection(queueDirection(state, 'up'), 'left')

    expect(queued.pendingDirection).toBe('up')
  })
})

describe('spawnFood', () => {
  it('elige solo entre celdas libres', () => {
    const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }]

    expect(spawnFood(snake, alwaysFirst)).toEqual({ x: 2, y: 0 })
  })

  it('devuelve null si no queda ninguna celda libre', () => {
    const fullBoard = Array.from({ length: BOARD_COLUMNS * BOARD_ROWS }, (_, index) => ({
      x: index % BOARD_COLUMNS,
      y: Math.floor(index / BOARD_COLUMNS),
    }))

    expect(spawnFood(fullBoard, alwaysFirst)).toBeNull()
  })
})
