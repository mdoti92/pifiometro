import type { PixelRect } from '../shared/PixelCanvas'
import type { RandomSource } from '../shared/useGameLoop'

// Vista apaisada en unidades lógicas; la altura del dino se mide hacia arriba desde el suelo.
export const VIEW_WIDTH = 72
export const VIEW_HEIGHT = 36
export const GROUND_Y = 30
export const DINO_X = 6
export const DINO_WIDTH = 5
export const DINO_HEIGHT = 6
export const CACTUS_WIDTH = 3
export const MIN_CACTUS_HEIGHT = 4
export const MAX_CACTUS_HEIGHT = 7
export const GRAVITY = 0.05
export const JUMP_VELOCITY = 1.3
/** Ticks que dura un salto completo. */
export const AIR_TICKS = Math.ceil((2 * JUMP_VELOCITY) / GRAVITY)
export const INITIAL_SPEED = 0.4
export const ACCELERATION = 0.0002
export const MAX_SPEED = 1
export const SCORE_UNIT = 5
export const TICK_MS = 1000 / 60

// Separación entre cactus en múltiplos de lo que avanza el escenario durante un salto.
const MIN_GAP_IN_JUMPS = 1.3
const EXTRA_GAP_IN_JUMPS = 1.4

export interface Cactus {
  x: number
  height: number
}

export interface DinoState {
  altitude: number
  velocity: number
  speed: number
  distance: number
  cacti: Cactus[]
  score: number
  isOver: boolean
}

export function minCactusGap(speed: number): number {
  return speed * AIR_TICKS * MIN_GAP_IN_JUMPS
}

function randomCactus(x: number, random: RandomSource): Cactus {
  return { x, height: MIN_CACTUS_HEIGHT + Math.floor(random() * (MAX_CACTUS_HEIGHT - MIN_CACTUS_HEIGHT + 1)) }
}

export function createDino(random: RandomSource): DinoState {
  return {
    altitude: 0,
    velocity: 0,
    speed: INITIAL_SPEED,
    distance: 0,
    cacti: [randomCactus(VIEW_WIDTH, random)],
    score: 0,
    isOver: false,
  }
}

export function jump(state: DinoState): DinoState {
  return state.altitude > 0 ? state : { ...state, velocity: JUMP_VELOCITY }
}

function advanceCacti(cacti: Cactus[], speed: number, random: RandomSource): Cactus[] {
  const moved = cacti.map((cactus) => ({ ...cactus, x: cactus.x - speed })).filter((cactus) => cactus.x + CACTUS_WIDTH > 0)
  const last = moved[moved.length - 1]
  if (last && last.x > VIEW_WIDTH - minCactusGap(speed)) return moved

  const gap = minCactusGap(speed) + random() * speed * AIR_TICKS * EXTRA_GAP_IN_JUMPS
  const x = last ? Math.max(last.x + gap, VIEW_WIDTH) : VIEW_WIDTH
  return [...moved, randomCactus(x, random)]
}

function hitsCactus(altitude: number, cactus: Cactus): boolean {
  const overlapsX = DINO_X + DINO_WIDTH > cactus.x && DINO_X < cactus.x + CACTUS_WIDTH
  return overlapsX && altitude < cactus.height
}

export function stepDino(state: DinoState, _input: undefined, random: RandomSource): DinoState {
  if (state.isOver) return state

  let velocity = state.velocity - GRAVITY
  let altitude = state.altitude + velocity
  if (altitude <= 0) {
    altitude = 0
    velocity = 0
  }

  const speed = Math.min(state.speed + ACCELERATION, MAX_SPEED)
  const distance = state.distance + state.speed
  const cacti = advanceCacti(state.cacti, state.speed, random)

  return {
    altitude,
    velocity,
    speed,
    distance,
    cacti,
    score: Math.floor(distance / SCORE_UNIT),
    isOver: cacti.some((cactus) => hitsCactus(altitude, cactus)),
  }
}

function dinoRects(altitude: number): PixelRect[] {
  const top = GROUND_Y - altitude - DINO_HEIGHT
  return [
    { x: DINO_X + 2, y: top, w: 3, h: 2 },
    { x: DINO_X, y: top + 2, w: 4, h: 2 },
    { x: DINO_X + 1, y: top + 4, w: 1, h: 2 },
    { x: DINO_X + 3, y: top + 4, w: 1, h: 2 },
  ]
}

export function toScreenRects(state: DinoState): PixelRect[] {
  const cacti = state.cacti.flatMap((cactus) => [
    { x: cactus.x + 1, y: GROUND_Y - cactus.height, w: 1, h: cactus.height },
    { x: cactus.x, y: GROUND_Y - cactus.height + 2, w: CACTUS_WIDTH, h: 1 },
  ])
  return [{ x: 0, y: GROUND_Y, w: VIEW_WIDTH, h: 1 }, ...dinoRects(state.altitude), ...cacti]
}
