import { describe, expect, it } from 'vitest'
import {
  BIRD_HEIGHT,
  BIRD_X,
  FLAP_VELOCITY,
  GAP_HEIGHT,
  GRAVITY,
  GROUND_HEIGHT,
  MAX_GAP_SHIFT,
  PIPE_SPACING,
  PIPE_WIDTH,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  advancePipes,
  createFlappy,
  flap,
  stepFlappy,
  toScreenRects,
  type FlappyState,
} from './flappy'

const alwaysHalf = () => 0.5

function state(overrides: Partial<FlappyState> = {}): FlappyState {
  return { ...createFlappy(alwaysHalf), ...overrides }
}

describe('flappy', () => {
  it('sin tocar nada el pájaro cae con gravedad constante', () => {
    const initial = state({ birdY: 30, velocity: 0, pipes: [] })

    const next = stepFlappy(initial, undefined, alwaysHalf)

    expect(next.velocity).toBe(GRAVITY)
    expect(next.birdY).toBe(30 + GRAVITY)
  })

  it('aletear le da un impulso fijo hacia arriba', () => {
    expect(flap(state({ velocity: 3 })).velocity).toBe(FLAP_VELOCITY)
    expect(FLAP_VELOCITY).toBeLessThan(0)
  })

  it('aparecen tuberías desde la derecha a distancia fija, con hueco atravesable', () => {
    let pipes: FlappyState['pipes'] = []
    let pairsChecked = 0
    for (let i = 0; i < 400; i++) {
      pipes = advancePipes(pipes, Math.random)
      for (let j = 1; j < pipes.length; j++) {
        expect(pipes[j].x - pipes[j - 1].x).toBeCloseTo(PIPE_SPACING)
        expect(Math.abs(pipes[j].gapY - pipes[j - 1].gapY)).toBeLessThanOrEqual(MAX_GAP_SHIFT)
        pairsChecked++
      }
      for (const pipe of pipes) {
        expect(pipe.gapY).toBeGreaterThanOrEqual(0)
        expect(pipe.gapY + GAP_HEIGHT).toBeLessThanOrEqual(VIEW_HEIGHT - GROUND_HEIGHT)
      }
    }

    expect(pairsChecked).toBeGreaterThan(0)
  })

  it('suma 1 al cruzar completo un par de tuberías', () => {
    const passing = state({ birdY: 30, velocity: 0, pipes: [{ x: BIRD_X - PIPE_WIDTH + 0.1, gapY: 20, passed: false }] })

    const next = stepFlappy(passing, undefined, alwaysHalf)

    expect(next.score).toBe(1)
    expect(stepFlappy(next, undefined, alwaysHalf).score).toBe(1)
  })

  it('choca contra una tubería', () => {
    const crashing = state({ birdY: 5, velocity: 0, pipes: [{ x: BIRD_X, gapY: 30, passed: false }] })

    expect(stepFlappy(crashing, undefined, alwaysHalf).isOver).toBe(true)
  })

  it('choca contra el piso y el techo', () => {
    const floor = state({ birdY: VIEW_HEIGHT - GROUND_HEIGHT - BIRD_HEIGHT, velocity: 1, pipes: [] })
    const ceiling = state({ birdY: 0, velocity: -1, pipes: [] })

    expect(stepFlappy(floor, undefined, alwaysHalf).isOver).toBe(true)
    expect(stepFlappy(ceiling, undefined, alwaysHalf).isOver).toBe(true)
  })

  it('dibuja pájaro, tuberías y piso', () => {
    const rects = toScreenRects(state({ pipes: [{ x: 20, gapY: 20, passed: false }] }))

    expect(rects.some((rect) => rect.w === VIEW_WIDTH && rect.h === GROUND_HEIGHT)).toBe(true)
    expect(rects.filter((rect) => rect.w === PIPE_WIDTH)).toHaveLength(2)
  })
})
