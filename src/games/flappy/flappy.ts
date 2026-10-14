import type { PixelRect } from '../shared/PixelCanvas'
import type { RandomSource } from '../shared/useGameLoop'

// Unidades lógicas en coordenadas de pantalla (y crece hacia abajo).
export const VIEW_WIDTH = 48
export const VIEW_HEIGHT = 72
export const GROUND_HEIGHT = 4
export const BIRD_X = 10
export const BIRD_WIDTH = 4
export const BIRD_HEIGHT = 3
export const GRAVITY = 0.16
export const FLAP_VELOCITY = -2
export const PIPE_WIDTH = 6
export const PIPE_SPACING = 30
export const PIPE_SPEED = 0.6
export const GAP_HEIGHT = 22
export const MAX_GAP_SHIFT = 18
export const TICK_MS = 33

const GAP_MARGIN = 4
const MIN_GAP_Y = GAP_MARGIN
const MAX_GAP_Y = VIEW_HEIGHT - GROUND_HEIGHT - GAP_HEIGHT - GAP_MARGIN

export interface Pipe {
  x: number
  gapY: number
  passed: boolean
}

export interface FlappyState {
  birdY: number
  velocity: number
  pipes: Pipe[]
  score: number
  isOver: boolean
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function nextGapY(previous: Pipe | undefined, random: RandomSource): number {
  if (!previous) return MIN_GAP_Y + random() * (MAX_GAP_Y - MIN_GAP_Y)
  // El hueco nuevo no se aleja demasiado del anterior para que siempre se pueda llegar.
  const shifted = previous.gapY + (random() * 2 - 1) * MAX_GAP_SHIFT
  return clamp(shifted, MIN_GAP_Y, MAX_GAP_Y)
}

export function advancePipes(pipes: Pipe[], random: RandomSource): Pipe[] {
  const moved = pipes.map((pipe) => ({ ...pipe, x: pipe.x - PIPE_SPEED })).filter((pipe) => pipe.x + PIPE_WIDTH > 0)
  const last = moved[moved.length - 1]
  if (last && last.x > VIEW_WIDTH - PIPE_SPACING) return moved

  const x = last ? last.x + PIPE_SPACING : VIEW_WIDTH
  return [...moved, { x, gapY: nextGapY(last, random), passed: false }]
}

export function createFlappy(_random: RandomSource): FlappyState {
  return { birdY: (VIEW_HEIGHT - GROUND_HEIGHT) / 2, velocity: 0, pipes: [], score: 0, isOver: false }
}

export function flap(state: FlappyState): FlappyState {
  return { ...state, velocity: FLAP_VELOCITY }
}

function hitsPipe(birdY: number, pipe: Pipe): boolean {
  const overlapsX = BIRD_X + BIRD_WIDTH > pipe.x && BIRD_X < pipe.x + PIPE_WIDTH
  const insideGap = birdY >= pipe.gapY && birdY + BIRD_HEIGHT <= pipe.gapY + GAP_HEIGHT
  return overlapsX && !insideGap
}

export function stepFlappy(state: FlappyState, _input: undefined, random: RandomSource): FlappyState {
  if (state.isOver) return state

  const velocity = state.velocity + GRAVITY
  const birdY = state.birdY + velocity

  let score = state.score
  const pipes = advancePipes(state.pipes, random).map((pipe) => {
    if (pipe.passed || pipe.x + PIPE_WIDTH > BIRD_X) return pipe
    score += 1
    return { ...pipe, passed: true }
  })

  const hitsGround = birdY + BIRD_HEIGHT >= VIEW_HEIGHT - GROUND_HEIGHT
  const hitsCeiling = birdY <= 0
  const isOver = hitsGround || hitsCeiling || pipes.some((pipe) => hitsPipe(birdY, pipe))

  return { birdY: clamp(birdY, 0, VIEW_HEIGHT - GROUND_HEIGHT - BIRD_HEIGHT), velocity, pipes, score, isOver }
}

function birdRects(y: number): PixelRect[] {
  return [
    { x: BIRD_X, y: y + 1, w: BIRD_WIDTH - 1, h: BIRD_HEIGHT - 1 },
    { x: BIRD_X + 1, y, w: BIRD_WIDTH - 2, h: 1 },
    { x: BIRD_X + BIRD_WIDTH - 1, y: y + 1, w: 1, h: 1 },
  ]
}

export function toScreenRects(state: FlappyState): PixelRect[] {
  const pipes = state.pipes.flatMap((pipe) => [
    { x: pipe.x, y: 0, w: PIPE_WIDTH, h: pipe.gapY },
    {
      x: pipe.x,
      y: pipe.gapY + GAP_HEIGHT,
      w: PIPE_WIDTH,
      h: VIEW_HEIGHT - GROUND_HEIGHT - pipe.gapY - GAP_HEIGHT,
    },
  ])
  return [
    ...birdRects(state.birdY),
    ...pipes,
    { x: 0, y: VIEW_HEIGHT - GROUND_HEIGHT, w: VIEW_WIDTH, h: GROUND_HEIGHT },
  ]
}
