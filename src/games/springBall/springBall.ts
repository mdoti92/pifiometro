import type { Horizontal } from '../shared/input'
import type { PixelRect } from '../shared/PixelCanvas'
import type { RandomSource } from '../shared/useGameLoop'

// Unidades lógicas: cada una es un píxel del LCD. El eje y crece hacia arriba (altura).
export const VIEW_WIDTH = 48
export const VIEW_HEIGHT = 72
export const BALL_SIZE = 3
export const PLATFORM_WIDTH = 11
export const PLATFORM_HEIGHT = 2
export const GRAVITY = 0.12
export const BOUNCE_VELOCITY = 2.4
export const HORIZONTAL_SPEED = 0.9
export const MAX_JUMP_HEIGHT = (BOUNCE_VELOCITY * BOUNCE_VELOCITY) / (2 * GRAVITY)
export const MIN_PLATFORM_GAP = 8
export const MAX_PLATFORM_GAP = 16
export const SCORE_UNIT = 4
export const TICK_MS = 33

const INITIAL_PLATFORM_Y = 4
const CAMERA_FOLLOW_RATIO = 0.5
const GENERATION_MARGIN = VIEW_HEIGHT

export interface Platform {
  x: number
  y: number
}

export interface SpringBallState {
  ball: { x: number; y: number; vy: number }
  platforms: Platform[]
  cameraY: number
  maxHeight: number
  score: number
  isOver: boolean
}

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size
}

function randomPlatformX(random: RandomSource): number {
  return Math.floor(random() * (VIEW_WIDTH - PLATFORM_WIDTH + 1))
}

function fillPlatformsUpTo(platforms: Platform[], targetY: number, random: RandomSource): Platform[] {
  const filled = [...platforms]
  let highest = Math.max(...filled.map((platform) => platform.y))
  while (highest < targetY) {
    highest += MIN_PLATFORM_GAP + random() * (MAX_PLATFORM_GAP - MIN_PLATFORM_GAP)
    filled.push({ x: randomPlatformX(random), y: highest })
  }
  return filled
}

export function createSpringBall(random: RandomSource): SpringBallState {
  const start: Platform = { x: (VIEW_WIDTH - PLATFORM_WIDTH) / 2, y: INITIAL_PLATFORM_Y }
  return {
    ball: { x: (VIEW_WIDTH - BALL_SIZE) / 2, y: start.y + PLATFORM_HEIGHT, vy: BOUNCE_VELOCITY },
    platforms: fillPlatformsUpTo([start], VIEW_HEIGHT + GENERATION_MARGIN, random),
    cameraY: 0,
    maxHeight: 0,
    score: 0,
    isOver: false,
  }
}

function overlapsHorizontally(ballX: number, platform: Platform): boolean {
  return ballX + BALL_SIZE > platform.x && ballX < platform.x + PLATFORM_WIDTH
}

export function stepSpringBall(state: SpringBallState, input: Horizontal, random: RandomSource): SpringBallState {
  if (state.isOver) return state

  const x = wrap(state.ball.x + input * HORIZONTAL_SPEED, VIEW_WIDTH)
  let vy = state.ball.vy - GRAVITY
  let y = state.ball.y + vy

  // Solo rebota al caer y cruzar el borde superior de la plataforma; desde abajo la atraviesa.
  if (vy < 0) {
    const landing = state.platforms.find((platform) => {
      const top = platform.y + PLATFORM_HEIGHT
      return state.ball.y >= top && y <= top && overlapsHorizontally(x, platform)
    })
    if (landing) {
      y = landing.y + PLATFORM_HEIGHT
      vy = BOUNCE_VELOCITY
    }
  }

  const cameraY = Math.max(state.cameraY, y - VIEW_HEIGHT * CAMERA_FOLLOW_RATIO)
  const maxHeight = Math.max(state.maxHeight, y)
  const visiblePlatforms = state.platforms.filter((platform) => platform.y + PLATFORM_HEIGHT >= cameraY)
  const platforms = fillPlatformsUpTo(
    visiblePlatforms.length > 0 ? visiblePlatforms : [{ x: randomPlatformX(random), y: cameraY }],
    cameraY + VIEW_HEIGHT + GENERATION_MARGIN,
    random,
  )

  return {
    ball: { x, y, vy },
    platforms,
    cameraY,
    maxHeight,
    score: Math.floor(maxHeight / SCORE_UNIT),
    isOver: y + BALL_SIZE < cameraY,
  }
}

export function toScreenRects(state: SpringBallState): PixelRect[] {
  const toScreenY = (worldY: number, height: number) => VIEW_HEIGHT - (worldY - state.cameraY) - height

  const ball = { x: state.ball.x, y: toScreenY(state.ball.y, BALL_SIZE), w: BALL_SIZE, h: BALL_SIZE }
  const platforms = state.platforms
    .filter((platform) => platform.y - state.cameraY <= VIEW_HEIGHT)
    .map((platform) => ({
      x: platform.x,
      y: toScreenY(platform.y, PLATFORM_HEIGHT),
      w: PLATFORM_WIDTH,
      h: PLATFORM_HEIGHT,
    }))

  return [ball, ...platforms]
}
