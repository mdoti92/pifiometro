import { bounceOffPaddle, movePaddle, type PaddleInput } from '../shared/paddle'
import type { PixelRect } from '../shared/PixelCanvas'
import type { RandomSource } from '../shared/useGameLoop'

// Coordenadas de pantalla (y crece hacia abajo).
export const VIEW_WIDTH = 48
export const VIEW_HEIGHT = 72
export const BRICK_ROWS = 5
export const BRICK_COLUMNS = 8
export const BRICK_WIDTH = 5
export const BRICK_HEIGHT = 2
export const BRICKS_TOP = 8
export const BRICK_POINTS = 1
export const PADDLE_WIDTH = 10
export const PADDLE_HEIGHT = 2
export const PADDLE_Y = VIEW_HEIGHT - 4
export const PADDLE_SPEED = 0.8
export const BALL_SIZE = 2
export const INITIAL_BALL_SPEED = 0.45
export const WAVE_SPEED_INCREMENT = 0.075
export const INITIAL_LIVES = 3
export const TICK_MS = 1000 / 60

const BRICK_SPACING_X = VIEW_WIDTH / BRICK_COLUMNS
const BRICK_SPACING_Y = BRICK_HEIGHT + 1
const LAUNCH_ANGLE = Math.PI / 6

export interface Brick {
  x: number
  y: number
}

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
}

export interface BreakoutState {
  bricks: Brick[]
  ball: Ball
  ballStuck: boolean
  paddleX: number
  speed: number
  lives: number
  score: number
  isOver: boolean
}

function fullWave(): Brick[] {
  const bricks: Brick[] = []
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let column = 0; column < BRICK_COLUMNS; column++) {
      bricks.push({ x: column * BRICK_SPACING_X + (BRICK_SPACING_X - BRICK_WIDTH) / 2, y: BRICKS_TOP + row * BRICK_SPACING_Y })
    }
  }
  return bricks
}

function ballOnPaddle(paddleX: number): Ball {
  return { x: paddleX + (PADDLE_WIDTH - BALL_SIZE) / 2, y: PADDLE_Y - BALL_SIZE, vx: 0, vy: 0 }
}

export function createBreakout(_random: RandomSource): BreakoutState {
  const paddleX = (VIEW_WIDTH - PADDLE_WIDTH) / 2
  return {
    bricks: fullWave(),
    ball: ballOnPaddle(paddleX),
    ballStuck: true,
    paddleX,
    speed: INITIAL_BALL_SPEED,
    lives: INITIAL_LIVES,
    score: 0,
    isOver: false,
  }
}

export function launch(state: BreakoutState): BreakoutState {
  if (!state.ballStuck) return state
  return {
    ...state,
    ballStuck: false,
    ball: { ...state.ball, vx: state.speed * Math.sin(LAUNCH_ANGLE), vy: -state.speed * Math.cos(LAUNCH_ANGLE) },
  }
}

function overlapsBrick(ball: { x: number; y: number }, brick: Brick): boolean {
  return ball.x < brick.x + BRICK_WIDTH && ball.x + BALL_SIZE > brick.x && ball.y < brick.y + BRICK_HEIGHT && ball.y + BALL_SIZE > brick.y
}

export function stepBreakout(state: BreakoutState, input: PaddleInput, _random: RandomSource): BreakoutState {
  if (state.isOver) return state

  const paddleX = movePaddle(state.paddleX, input, { width: PADDLE_WIDTH, fieldWidth: VIEW_WIDTH, speed: PADDLE_SPEED })
  if (state.ballStuck) return { ...state, paddleX, ball: ballOnPaddle(paddleX) }

  const previous = state.ball
  let { vx, vy } = previous
  let x = previous.x + vx
  let y = previous.y + vy

  if (x < 0 || x > VIEW_WIDTH - BALL_SIZE) {
    x = Math.min(Math.max(x, 0), VIEW_WIDTH - BALL_SIZE)
    vx = -vx
  }
  if (y < 0) {
    y = 0
    vy = Math.abs(vy)
  }

  const hitsPaddle =
    vy > 0 && y + BALL_SIZE >= PADDLE_Y && y < PADDLE_Y + PADDLE_HEIGHT && x + BALL_SIZE > paddleX && x < paddleX + PADDLE_WIDTH
  if (hitsPaddle) {
    ;({ vx, vy } = bounceOffPaddle({ ballCenterX: x + BALL_SIZE / 2, paddleX, paddleWidth: PADDLE_WIDTH, speed: state.speed, upward: true, incoming: { vx, vy } }))
    y = PADDLE_Y - BALL_SIZE
  }

  let { bricks, score } = state
  const hit = bricks.find((brick) => overlapsBrick({ x, y }, brick))
  if (hit) {
    bricks = bricks.filter((brick) => brick !== hit)
    score += BRICK_POINTS
    // Si antes del paso ya estaba a la altura del ladrillo, el golpe fue de costado.
    const cameFromSide = previous.y < hit.y + BRICK_HEIGHT && previous.y + BALL_SIZE > hit.y
    if (cameFromSide) vx = -vx
    else vy = -vy
  }

  if (bricks.length === 0) {
    const speed = state.speed + WAVE_SPEED_INCREMENT
    return { ...state, bricks: fullWave(), ball: ballOnPaddle(paddleX), ballStuck: true, paddleX, speed, score }
  }

  if (y > VIEW_HEIGHT) {
    const lives = state.lives - 1
    return { ...state, bricks, ball: ballOnPaddle(paddleX), ballStuck: true, paddleX, lives, score, isOver: lives <= 0 }
  }

  return { ...state, bricks, ball: { x, y, vx, vy }, paddleX, score }
}

export function toScreenRects(state: BreakoutState): PixelRect[] {
  return [
    ...state.bricks.map((brick) => ({ x: brick.x, y: brick.y, w: BRICK_WIDTH, h: BRICK_HEIGHT })),
    { x: state.paddleX, y: PADDLE_Y, w: PADDLE_WIDTH, h: PADDLE_HEIGHT },
    { x: state.ball.x, y: state.ball.y, w: BALL_SIZE, h: BALL_SIZE },
  ]
}
