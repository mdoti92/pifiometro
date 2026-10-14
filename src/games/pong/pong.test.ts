import { describe, expect, it } from 'vitest'
import {
  BALL_SIZE,
  CPU_MAX_SPEED,
  CPU_Y,
  INITIAL_BALL_SPEED,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PLAYER_Y,
  SPEED_INCREMENT,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WINNING_POINTS,
  createPong,
  stepPong,
  toScreenRects,
  type PongState,
} from './pong'

const still = { target: null, hold: 0 as const }
const half = () => 0.5

function state(overrides: Partial<PongState> = {}): PongState {
  return { ...createPong(half), ...overrides }
}

describe('createPong', () => {
  it('arranca con la pelota al centro, saliendo hacia un lado al azar', () => {
    const toLeft = createPong(() => 0.1)
    const toRight = createPong(() => 0.9)

    expect(toLeft.ball.x).toBeCloseTo((VIEW_WIDTH - BALL_SIZE) / 2)
    expect(toLeft.ball.vx).toBeLessThan(0)
    expect(toRight.ball.vx).toBeGreaterThan(0)
    expect(Math.hypot(toLeft.ball.vx, toLeft.ball.vy)).toBeCloseTo(INITIAL_BALL_SPEED)
  })
})

describe('stepPong', () => {
  it('mi paleta sigue el dedo sin salirse de la cancha', () => {
    expect(stepPong(state(), { target: 1, hold: 0 }, half).playerX).toBe(VIEW_WIDTH - PADDLE_WIDTH)
  })

  it('la pelota rebota en las paredes laterales', () => {
    const next = stepPong(state({ ball: { x: 0.1, y: 30, vx: -1, vy: 0.5 }, speed: 1 }), still, half)

    expect(next.ball.vx).toBeGreaterThan(0)
  })

  it('al pegar en mi paleta rebota hacia arriba y acelera', () => {
    const ball = { x: 20, y: PLAYER_Y - BALL_SIZE - 0.2, vx: 0, vy: 1 }
    const next = stepPong(state({ ball, speed: 1, playerX: 16 }), still, half)

    expect(next.ball.vy).toBeLessThan(0)
    expect(next.speed).toBeCloseTo(1 + SPEED_INCREMENT)
  })

  it('al pegar en la paleta de la CPU rebota hacia abajo', () => {
    const ball = { x: 20, y: CPU_Y + PADDLE_HEIGHT + 0.2, vx: 0, vy: -1 }
    const next = stepPong(state({ ball, speed: 1, cpuX: 16 }), still, half)

    expect(next.ball.vy).toBeGreaterThan(0)
  })

  it('la CPU sigue la pelota con velocidad máxima limitada', () => {
    const next = stepPong(state({ cpuX: 0, ball: { x: 40, y: 30, vx: 0, vy: -0.5 } }), still, half)

    expect(next.cpuX).toBeCloseTo(CPU_MAX_SPEED)
  })

  it('si la pelota pasa mi borde, la CPU suma y la pelota vuelve al centro a velocidad inicial', () => {
    const next = stepPong(state({ ball: { x: 2, y: VIEW_HEIGHT, vx: 0, vy: 2 }, speed: 2, playerX: 30 }), still, half)

    expect(next.cpuScore).toBe(1)
    expect(next.ball.y).toBeCloseTo((VIEW_HEIGHT - BALL_SIZE) / 2)
    expect(next.speed).toBe(INITIAL_BALL_SPEED)
  })

  it('si la pelota pasa el borde de la CPU, sumo yo', () => {
    const next = stepPong(state({ ball: { x: 2, y: -BALL_SIZE, vx: 0, vy: -2 }, cpuX: 30 }), still, half)

    expect(next.playerScore).toBe(1)
  })

  it('el partido termina al llegar a 5 puntos', () => {
    const next = stepPong(
      state({ playerScore: WINNING_POINTS - 1, ball: { x: 2, y: -BALL_SIZE, vx: 0, vy: -2 }, cpuX: 30 }),
      still,
      half,
    )

    expect(next.isOver).toBe(true)
    expect(next.playerWon).toBe(true)
  })
})

describe('toScreenRects', () => {
  it('dibuja dos paletas, la pelota y la línea media', () => {
    expect(toScreenRects(state()).length).toBeGreaterThanOrEqual(4)
  })
})
