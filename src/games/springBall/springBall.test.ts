import { describe, expect, it } from 'vitest'
import {
  BALL_SIZE,
  BOUNCE_VELOCITY,
  HORIZONTAL_SPEED,
  MAX_PLATFORM_GAP,
  MAX_JUMP_HEIGHT,
  PLATFORM_HEIGHT,
  SCORE_UNIT,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  createSpringBall,
  stepSpringBall,
  toScreenRects,
  type SpringBallState,
} from './springBall'

const alwaysHalf = () => 0.5

function withBall(state: SpringBallState, ball: Partial<SpringBallState['ball']>): SpringBallState {
  return { ...state, ball: { ...state.ball, ...ball } }
}

describe('createSpringBall', () => {
  it('arranca con la pelota rebotando sobre la plataforma inicial', () => {
    const state = createSpringBall(alwaysHalf)
    const [first] = state.platforms

    expect(state.ball.y).toBe(first.y + PLATFORM_HEIGHT)
    expect(state.ball.vy).toBe(BOUNCE_VELOCITY)
    expect(state.score).toBe(0)
  })

  it('genera plataformas hasta arriba de la pantalla con huecos alcanzables', () => {
    const state = createSpringBall(Math.random)
    const heights = state.platforms.map((platform) => platform.y).sort((a, b) => a - b)

    expect(heights[heights.length - 1]).toBeGreaterThan(VIEW_HEIGHT)
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i] - heights[i - 1]).toBeLessThanOrEqual(MAX_PLATFORM_GAP)
    }
    expect(MAX_PLATFORM_GAP).toBeLessThan(MAX_JUMP_HEIGHT)
  })
})

describe('stepSpringBall', () => {
  it('rebota automáticamente al caer sobre una plataforma desde arriba', () => {
    const state = createSpringBall(alwaysHalf)
    const platform = state.platforms[0]
    const falling = withBall(state, { x: platform.x + 1, y: platform.y + PLATFORM_HEIGHT + 0.1, vy: -1 })

    const next = stepSpringBall(falling, 0, alwaysHalf)

    expect(next.ball.vy).toBe(BOUNCE_VELOCITY)
    expect(next.ball.y).toBe(platform.y + PLATFORM_HEIGHT)
  })

  it('atraviesa una plataforma si viene desde abajo', () => {
    const state = createSpringBall(alwaysHalf)
    const platform = state.platforms[0]
    const rising = withBall(state, { x: platform.x + 1, y: platform.y - 0.5, vy: 2 })

    const next = stepSpringBall(rising, 0, alwaysHalf)

    expect(next.ball.y).toBeGreaterThan(platform.y)
    expect(next.ball.vy).toBeLessThan(2)
  })

  it('se mueve hacia el lado que se mantiene apretado', () => {
    const state = withBall(createSpringBall(alwaysHalf), { x: 20 })

    expect(stepSpringBall(state, 1, alwaysHalf).ball.x).toBeCloseTo(20 + HORIZONTAL_SPEED)
    expect(stepSpringBall(state, -1, alwaysHalf).ball.x).toBeCloseTo(20 - HORIZONTAL_SPEED)
  })

  it('si sale por un costado reaparece por el opuesto', () => {
    const state = withBall(createSpringBall(alwaysHalf), { x: VIEW_WIDTH - 0.2 })

    const next = stepSpringBall(state, 1, alwaysHalf)

    expect(next.ball.x).toBeLessThan(HORIZONTAL_SPEED)
  })

  it('la cámara sigue a la pelota cuando pasa la mitad de la pantalla y suma puntaje por altura', () => {
    const state = withBall(createSpringBall(alwaysHalf), { y: VIEW_HEIGHT, vy: 1 })

    const next = stepSpringBall(state, 0, alwaysHalf)

    expect(next.cameraY).toBeGreaterThan(0)
    expect(next.score).toBe(Math.floor(next.maxHeight / SCORE_UNIT))
    expect(next.score).toBeGreaterThan(0)
  })

  it('genera plataformas nuevas arriba a medida que sube', () => {
    const state = withBall(createSpringBall(Math.random), { y: VIEW_HEIGHT * 3, vy: 1 })

    const next = stepSpringBall(state, 0, Math.random)
    const highest = Math.max(...next.platforms.map((platform) => platform.y))

    expect(highest).toBeGreaterThan(next.cameraY + VIEW_HEIGHT)
  })

  it('termina si la pelota cae por debajo del borde inferior', () => {
    const state = withBall(createSpringBall(alwaysHalf), { x: 0, y: -BALL_SIZE - 1, vy: -1 })
    const withoutPlatforms = { ...state, platforms: [] }

    expect(stepSpringBall(withoutPlatforms, 0, alwaysHalf).isOver).toBe(true)
  })
})

describe('toScreenRects', () => {
  it('dibuja pelota y plataformas visibles en coordenadas de pantalla', () => {
    const state = createSpringBall(alwaysHalf)

    const rects = toScreenRects(state)

    const ball = rects[0]
    expect(ball.w).toBe(BALL_SIZE)
    expect(ball.y).toBeCloseTo(VIEW_HEIGHT - state.ball.y - BALL_SIZE)
    expect(rects.length).toBeGreaterThan(1)
  })
})
