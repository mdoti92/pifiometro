import { bounceOffPaddle, movePaddle, type PaddleInput } from '../shared/paddle'
import type { PixelRect } from '../shared/PixelCanvas'
import type { RandomSource } from '../shared/useGameLoop'

// Cancha vertical en coordenadas de pantalla (y crece hacia abajo): yo abajo, la CPU arriba.
export const VIEW_WIDTH = 48
export const VIEW_HEIGHT = 72
export const PADDLE_WIDTH = 10
export const PADDLE_HEIGHT = 2
export const PLAYER_Y = VIEW_HEIGHT - 4
export const CPU_Y = 2
export const BALL_SIZE = 2
export const INITIAL_BALL_SPEED = 0.45
export const SPEED_INCREMENT = 0.04
export const MAX_BALL_SPEED = 1.2
export const PLAYER_SPEED = 0.8
export const CPU_MAX_SPEED = 0.275
export const WINNING_POINTS = 5
export const TICK_MS = 1000 / 60

const SERVE_ANGLE = Math.PI / 6
const CENTER_LINE_DASH = 2

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
}

export interface PongState {
  ball: Ball
  speed: number
  playerX: number
  cpuX: number
  playerScore: number
  cpuScore: number
  isOver: boolean
  playerWon: boolean
}

function serve(random: RandomSource): Ball {
  const horizontal = random() < 0.5 ? -1 : 1
  const vertical = random() < 0.5 ? -1 : 1
  return {
    x: (VIEW_WIDTH - BALL_SIZE) / 2,
    y: (VIEW_HEIGHT - BALL_SIZE) / 2,
    vx: horizontal * INITIAL_BALL_SPEED * Math.sin(SERVE_ANGLE),
    vy: vertical * INITIAL_BALL_SPEED * Math.cos(SERVE_ANGLE),
  }
}

export function createPong(random: RandomSource): PongState {
  const centered = (VIEW_WIDTH - PADDLE_WIDTH) / 2
  return {
    ball: serve(random),
    speed: INITIAL_BALL_SPEED,
    playerX: centered,
    cpuX: centered,
    playerScore: 0,
    cpuScore: 0,
    isOver: false,
    playerWon: false,
  }
}

function overlapsPaddle(ballX: number, paddleX: number): boolean {
  return ballX + BALL_SIZE > paddleX && ballX < paddleX + PADDLE_WIDTH
}

function moveCpu(cpuX: number, ball: Ball): number {
  const target = ball.x + BALL_SIZE / 2 - PADDLE_WIDTH / 2
  const delta = Math.max(-CPU_MAX_SPEED, Math.min(CPU_MAX_SPEED, target - cpuX))
  return Math.max(0, Math.min(VIEW_WIDTH - PADDLE_WIDTH, cpuX + delta))
}

export function stepPong(state: PongState, input: PaddleInput, random: RandomSource): PongState {
  if (state.isOver) return state

  const playerX = movePaddle(state.playerX, input, { width: PADDLE_WIDTH, fieldWidth: VIEW_WIDTH, speed: PLAYER_SPEED })
  const cpuX = moveCpu(state.cpuX, state.ball)

  let { x, y, vx, vy } = state.ball
  let speed = state.speed
  x += vx
  y += vy

  if (x < 0) {
    x = 0
    vx = Math.abs(vx)
  } else if (x > VIEW_WIDTH - BALL_SIZE) {
    x = VIEW_WIDTH - BALL_SIZE
    vx = -Math.abs(vx)
  }

  const hitsPlayer = vy > 0 && y + BALL_SIZE >= PLAYER_Y && y < PLAYER_Y + PADDLE_HEIGHT && overlapsPaddle(x, playerX)
  const hitsCpu = vy < 0 && y <= CPU_Y + PADDLE_HEIGHT && y + BALL_SIZE > CPU_Y && overlapsPaddle(x, cpuX)
  if (hitsPlayer || hitsCpu) {
    speed = Math.min(speed + SPEED_INCREMENT, MAX_BALL_SPEED)
    const paddleX = hitsPlayer ? playerX : cpuX
    ;({ vx, vy } = bounceOffPaddle({ ballCenterX: x + BALL_SIZE / 2, paddleX, paddleWidth: PADDLE_WIDTH, speed, upward: hitsPlayer, incoming: { vx, vy } }))
    y = hitsPlayer ? PLAYER_Y - BALL_SIZE : CPU_Y + PADDLE_HEIGHT
  }

  const cpuScores = y > VIEW_HEIGHT
  const playerScores = y + BALL_SIZE < 0
  if (!cpuScores && !playerScores) return { ...state, ball: { x, y, vx, vy }, speed, playerX, cpuX }

  const playerScore = state.playerScore + (playerScores ? 1 : 0)
  const cpuScore = state.cpuScore + (cpuScores ? 1 : 0)
  return {
    ball: serve(random),
    speed: INITIAL_BALL_SPEED,
    playerX,
    cpuX,
    playerScore,
    cpuScore,
    isOver: playerScore >= WINNING_POINTS || cpuScore >= WINNING_POINTS,
    playerWon: playerScore >= WINNING_POINTS,
  }
}

export function toScreenRects(state: PongState): PixelRect[] {
  const centerLine: PixelRect[] = []
  for (let x = 0; x < VIEW_WIDTH; x += CENTER_LINE_DASH * 2) {
    centerLine.push({ x, y: VIEW_HEIGHT / 2, w: CENTER_LINE_DASH, h: 1 })
  }
  return [
    { x: state.playerX, y: PLAYER_Y, w: PADDLE_WIDTH, h: PADDLE_HEIGHT },
    { x: state.cpuX, y: CPU_Y, w: PADDLE_WIDTH, h: PADDLE_HEIGHT },
    { x: state.ball.x, y: state.ball.y, w: BALL_SIZE, h: BALL_SIZE },
    ...centerLine,
  ]
}
