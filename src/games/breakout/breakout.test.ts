import { describe, expect, it } from 'vitest'
import {
  BALL_SIZE,
  BRICK_COLUMNS,
  BRICK_HEIGHT,
  BRICK_POINTS,
  BRICK_ROWS,
  INITIAL_BALL_SPEED,
  INITIAL_LIVES,
  PADDLE_WIDTH,
  PADDLE_Y,
  WAVE_SPEED_INCREMENT,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  createBreakout,
  launch,
  stepBreakout,
  toScreenRects,
  type BreakoutState,
} from './breakout'

const still = { target: null, hold: 0 as const }
const half = () => 0.5

function state(overrides: Partial<BreakoutState> = {}): BreakoutState {
  return { ...createBreakout(half), ...overrides }
}

describe('createBreakout', () => {
  it('arranca con todas las filas de ladrillos, 3 vidas y la pelota apoyada en la paleta', () => {
    const initial = createBreakout(half)

    expect(initial.bricks).toHaveLength(BRICK_ROWS * BRICK_COLUMNS)
    expect(initial.lives).toBe(INITIAL_LIVES)
    expect(initial.ballStuck).toBe(true)
    expect(initial.ball.y).toBe(PADDLE_Y - BALL_SIZE)
  })
})

describe('stepBreakout', () => {
  it('con la pelota apoyada, se mueve junto con la paleta', () => {
    const next = stepBreakout(state(), { target: 0, hold: 0 }, half)

    expect(next.paddleX).toBe(0)
    expect(next.ball.x).toBeCloseTo((PADDLE_WIDTH - BALL_SIZE) / 2)
  })

  it('al lanzar sale hacia arriba en diagonal', () => {
    const launched = launch(state())

    expect(launched.ballStuck).toBe(false)
    expect(launched.ball.vy).toBeLessThan(0)
    expect(launched.ball.vx).not.toBe(0)
  })

  it('rebota en las paredes y el techo', () => {
    const side = stepBreakout(state({ ballStuck: false, ball: { x: 0.2, y: 40, vx: -1, vy: -0.5 } }), still, half)
    const top = stepBreakout(state({ ballStuck: false, ball: { x: 20, y: 0.2, vx: 0.5, vy: -1 } }), still, half)

    expect(side.ball.vx).toBeGreaterThan(0)
    expect(top.ball.vy).toBeGreaterThan(0)
  })

  it('al pegar en la paleta rebota hacia arriba', () => {
    const ball = { x: 22, y: PADDLE_Y - BALL_SIZE - 0.2, vx: 0, vy: 1 }
    const next = stepBreakout(state({ ballStuck: false, ball, paddleX: 19 }), still, half)

    expect(next.ball.vy).toBeLessThan(0)
  })

  it('al tocar un ladrillo lo rompe, rebota y suma puntos', () => {
    const initial = state({ ballStuck: false })
    const brick = initial.bricks[initial.bricks.length - 1]
    const ball = { x: brick.x + 1, y: brick.y + BRICK_HEIGHT + 0.5, vx: 0, vy: -1 }

    const next = stepBreakout({ ...initial, ball }, still, half)

    expect(next.bricks).toHaveLength(initial.bricks.length - 1)
    expect(next.ball.vy).toBeGreaterThan(0)
    expect(next.score).toBe(BRICK_POINTS)
  })

  it('al romper el último ladrillo aparece una tanda nueva y la pelota vuelve a la paleta más rápida', () => {
    const initial = state({ ballStuck: false })
    const brick = initial.bricks[0]
    const ball = { x: brick.x + 1, y: brick.y + BRICK_HEIGHT + 0.5, vx: 0, vy: -1 }

    const next = stepBreakout({ ...initial, bricks: [brick], ball }, still, half)

    expect(next.bricks).toHaveLength(BRICK_ROWS * BRICK_COLUMNS)
    expect(next.ballStuck).toBe(true)
    expect(next.speed).toBeCloseTo(INITIAL_BALL_SPEED + WAVE_SPEED_INCREMENT)
  })

  it('si la pelota pasa por debajo pierde una vida y vuelve a la paleta', () => {
    const next = stepBreakout(state({ ballStuck: false, ball: { x: 2, y: VIEW_HEIGHT, vx: 0, vy: 1 }, paddleX: 30 }), still, half)

    expect(next.lives).toBe(INITIAL_LIVES - 1)
    expect(next.ballStuck).toBe(true)
  })

  it('sin vidas termina la partida', () => {
    const next = stepBreakout(
      state({ lives: 1, ballStuck: false, ball: { x: 2, y: VIEW_HEIGHT, vx: 0, vy: 1 }, paddleX: 30 }),
      still,
      half,
    )

    expect(next.isOver).toBe(true)
  })
})

describe('toScreenRects', () => {
  it('dibuja ladrillos, paleta y pelota', () => {
    expect(toScreenRects(state())).toHaveLength(BRICK_ROWS * BRICK_COLUMNS + 2)
    expect(VIEW_WIDTH).toBeGreaterThan(0)
  })
})
