import type { PixelRect } from '../shared/PixelCanvas'
import type { RandomSource } from '../shared/useGameLoop'

// Unidades lógicas en coordenadas de pantalla (y crece hacia abajo), vista de frente al arco.
export const VIEW_WIDTH = 64
export const VIEW_HEIGHT = 48
export const GOAL_LEFT = 10
export const GOAL_RIGHT = 54
export const GOAL_TOP = 10
export const GOAL_BOTTOM = 30
export const POST_THICKNESS = 2
/** Franja a cada lado de los palos donde el remate se va afuera. */
export const MISS_MARGIN = 5
export const INDICATOR_MIN = GOAL_LEFT - MISS_MARGIN
export const INDICATOR_MAX = GOAL_RIGHT + MISS_MARGIN
export const INITIAL_SPEED = 0.8
export const SPEED_INCREMENT = 0.15
export const RESULT_TICKS = 30
export const TICK_MS = 33

const KEEPER_WIDTH = 8
const KEEPER_HEIGHT = 12
const BALL_SIZE = 3
const SPOT_Y = 40
const INDICATOR_Y = 4
const THIRDS = 3

export type Outcome = 'goal' | 'saved' | 'out'

export interface PenaltiesState {
  phase: 'aiming' | 'result'
  indicatorX: number
  direction: -1 | 1
  speed: number
  goals: number
  shotX: number | null
  keeperThird: number | null
  outcome: Outcome | null
  resultTicks: number
  isOver: boolean
}

const THIRD_WIDTH = (GOAL_RIGHT - GOAL_LEFT) / THIRDS

function thirdOf(x: number): number {
  return Math.min(Math.floor((x - GOAL_LEFT) / THIRD_WIDTH), THIRDS - 1)
}

export function createPenalties(_random: RandomSource): PenaltiesState {
  return {
    phase: 'aiming',
    indicatorX: INDICATOR_MIN,
    direction: 1,
    speed: INITIAL_SPEED,
    goals: 0,
    shotX: null,
    keeperThird: null,
    outcome: null,
    resultTicks: 0,
    isOver: false,
  }
}

export function shoot(state: PenaltiesState, random: RandomSource): PenaltiesState {
  if (state.phase !== 'aiming' || state.isOver) return state

  const shotX = state.indicatorX
  const keeperThird = Math.floor(random() * THIRDS)
  const outside = shotX < GOAL_LEFT || shotX > GOAL_RIGHT
  const outcome: Outcome = outside ? 'out' : thirdOf(shotX) === keeperThird ? 'saved' : 'goal'
  const scored = outcome === 'goal'

  return {
    ...state,
    phase: 'result',
    shotX,
    keeperThird,
    outcome,
    resultTicks: RESULT_TICKS,
    goals: scored ? state.goals + 1 : state.goals,
    speed: scored ? state.speed + SPEED_INCREMENT : state.speed,
    isOver: !scored,
  }
}

export function stepPenalties(state: PenaltiesState, _input: undefined, _random: RandomSource): PenaltiesState {
  if (state.isOver) return state

  if (state.phase === 'result') {
    const resultTicks = state.resultTicks - 1
    if (resultTicks > 0) return { ...state, resultTicks }
    return { ...state, phase: 'aiming', resultTicks: 0, shotX: null, keeperThird: null, outcome: null }
  }

  let indicatorX = state.indicatorX + state.direction * state.speed
  let direction = state.direction
  if (indicatorX >= INDICATOR_MAX) {
    indicatorX = INDICATOR_MAX
    direction = -1
  } else if (indicatorX <= INDICATOR_MIN) {
    indicatorX = INDICATOR_MIN
    direction = 1
  }

  return { ...state, indicatorX, direction }
}

function keeperX(third: number | null): number {
  const center = third === null ? (GOAL_LEFT + GOAL_RIGHT) / 2 : GOAL_LEFT + THIRD_WIDTH * (third + 0.5)
  return center - KEEPER_WIDTH / 2
}

export function toScreenRects(state: PenaltiesState): PixelRect[] {
  const goal: PixelRect[] = [
    { x: GOAL_LEFT - POST_THICKNESS, y: GOAL_TOP, w: POST_THICKNESS, h: GOAL_BOTTOM - GOAL_TOP },
    { x: GOAL_RIGHT, y: GOAL_TOP, w: POST_THICKNESS, h: GOAL_BOTTOM - GOAL_TOP },
    { x: GOAL_LEFT - POST_THICKNESS, y: GOAL_TOP - POST_THICKNESS, w: GOAL_RIGHT - GOAL_LEFT + POST_THICKNESS * 2, h: POST_THICKNESS },
    { x: 0, y: GOAL_BOTTOM, w: VIEW_WIDTH, h: 1 },
  ]

  const kx = keeperX(state.keeperThird)
  const keeper: PixelRect[] = [
    { x: kx + 2, y: GOAL_BOTTOM - KEEPER_HEIGHT, w: KEEPER_WIDTH - 4, h: 3 },
    { x: kx, y: GOAL_BOTTOM - KEEPER_HEIGHT + 3, w: KEEPER_WIDTH, h: 4 },
    { x: kx + 1, y: GOAL_BOTTOM - KEEPER_HEIGHT + 7, w: 2, h: 5 },
    { x: kx + KEEPER_WIDTH - 3, y: GOAL_BOTTOM - KEEPER_HEIGHT + 7, w: 2, h: 5 },
  ]

  const ball =
    state.shotX === null
      ? { x: VIEW_WIDTH / 2 - BALL_SIZE / 2, y: SPOT_Y, w: BALL_SIZE, h: BALL_SIZE }
      : { x: state.shotX - BALL_SIZE / 2, y: GOAL_TOP + 6, w: BALL_SIZE, h: BALL_SIZE }

  const indicator =
    state.phase === 'aiming' ? [{ x: state.indicatorX - 1, y: INDICATOR_Y, w: 2, h: 3 }] : []

  return [...goal, ...keeper, ball, ...indicator]
}
