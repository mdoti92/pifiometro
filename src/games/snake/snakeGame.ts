export const BOARD_COLUMNS = 20
export const BOARD_ROWS = 13
export const INITIAL_SNAKE_LENGTH = 3
export const FOOD_POINTS = 1

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Cell {
  x: number
  y: number
}

export interface GameState {
  snake: Cell[]
  direction: Direction
  pendingDirection: Direction | null
  food: Cell
  score: number
  isOver: boolean
}

/** Devuelve un número en [0, 1), igual que Math.random; inyectable para tests. */
export type RandomSource = () => number

const DIRECTION_DELTAS: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y
}

function wrap(value: number, size: number): number {
  return (value + size) % size
}

export function spawnFood(snake: Cell[], random: RandomSource): Cell | null {
  const freeCells: Cell[] = []
  for (let y = 0; y < BOARD_ROWS; y++) {
    for (let x = 0; x < BOARD_COLUMNS; x++) {
      const cell = { x, y }
      if (!snake.some((segment) => sameCell(segment, cell))) freeCells.push(cell)
    }
  }

  if (freeCells.length === 0) return null
  return freeCells[Math.floor(random() * freeCells.length)]
}

export function createInitialState(random: RandomSource): GameState {
  const headX = Math.floor(BOARD_COLUMNS / 2)
  const rowY = Math.floor(BOARD_ROWS / 2)
  const snake = Array.from({ length: INITIAL_SNAKE_LENGTH }, (_, index) => ({ x: headX - index, y: rowY }))

  return {
    snake,
    direction: 'right',
    pendingDirection: null,
    // Con la víbora recién creada el tablero nunca está lleno.
    food: spawnFood(snake, random) as Cell,
    score: 0,
    isOver: false,
  }
}

export function queueDirection(state: GameState, requested: Direction): GameState {
  // Solo se acepta un cambio por tick: con dos giros rápidos la víbora podría volverse sobre sí misma.
  if (state.pendingDirection !== null) return state
  if (requested === state.direction || requested === OPPOSITE_DIRECTIONS[state.direction]) return state

  return { ...state, pendingDirection: requested }
}

export function tick(state: GameState, random: RandomSource): GameState {
  if (state.isOver) return state

  const direction = state.pendingDirection ?? state.direction
  const delta = DIRECTION_DELTAS[direction]
  const [head] = state.snake
  const newHead = { x: wrap(head.x + delta.x, BOARD_COLUMNS), y: wrap(head.y + delta.y, BOARD_ROWS) }

  const eats = sameCell(newHead, state.food)
  const body = eats ? state.snake : state.snake.slice(0, -1)

  if (body.some((segment) => sameCell(segment, newHead))) {
    return { ...state, direction, pendingDirection: null, isOver: true }
  }

  const snake = [newHead, ...body]
  const base = { ...state, snake, direction, pendingDirection: null }
  if (!eats) return base

  const food = spawnFood(snake, random)
  const score = state.score + FOOD_POINTS
  if (food === null) return { ...base, score, isOver: true }

  return { ...base, food, score }
}
