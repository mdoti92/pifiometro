import { describe, expect, it } from 'vitest'
import {
  AIR_TICKS,
  DINO_X,
  GRAVITY,
  INITIAL_SPEED,
  JUMP_VELOCITY,
  MAX_SPEED,
  SCORE_UNIT,
  createDino,
  jump,
  minCactusGap,
  stepDino,
  toScreenRects,
  type DinoState,
} from './dino'

const half = () => 0.5

function state(overrides: Partial<DinoState> = {}): DinoState {
  return { ...createDino(half), ...overrides }
}

describe('dino', () => {
  it('arranca en el suelo, sin puntaje y a velocidad inicial', () => {
    const initial = createDino(half)

    expect(initial.altitude).toBe(0)
    expect(initial.speed).toBe(INITIAL_SPEED)
    expect(initial.score).toBe(0)
  })

  it('salta con impulso fijo solo si está en el suelo y vuelve a caer por gravedad', () => {
    const jumping = jump(state())
    expect(jumping.velocity).toBe(JUMP_VELOCITY)

    const inAir = stepDino(jumping, undefined, half)
    expect(inAir.altitude).toBeGreaterThan(0)
    expect(inAir.velocity).toBeCloseTo(JUMP_VELOCITY - GRAVITY)
    expect(jump(inAir)).toBe(inAir)

    let current = inAir
    for (let i = 0; i < AIR_TICKS * 2; i++) current = stepDino({ ...current, cacti: [] }, undefined, half)
    expect(current.altitude).toBe(0)
  })

  it('el escenario avanza, el puntaje sube con la distancia y la velocidad aumenta hasta un máximo', () => {
    let current = state({ cacti: [] })
    for (let i = 0; i < 100; i++) current = stepDino({ ...current, cacti: [] }, undefined, half)

    expect(current.score).toBe(Math.floor(current.distance / SCORE_UNIT))
    expect(current.speed).toBeGreaterThan(INITIAL_SPEED)

    const fast = stepDino(state({ speed: MAX_SPEED, cacti: [] }), undefined, half)
    expect(fast.speed).toBe(MAX_SPEED)
  })

  it('los cactus aparecen desde la derecha separados al menos lo necesario para saltarlos', () => {
    let current = state()
    const gaps: number[] = []
    for (let i = 0; i < 2000; i++) {
      current = stepDino({ ...current, altitude: 30, velocity: 0 }, undefined, Math.random)
      for (let j = 1; j < current.cacti.length; j++) gaps.push(current.cacti[j].x - current.cacti[j - 1].x)
    }

    expect(gaps.length).toBeGreaterThan(0)
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(minCactusGap(INITIAL_SPEED) - 1e-9)
  })

  it('termina al chocar un cactus', () => {
    const crashing = state({ cacti: [{ x: DINO_X + 1, height: 5 }] })

    expect(stepDino(crashing, undefined, half).isOver).toBe(true)
  })

  it('saltando por encima no choca', () => {
    const above = state({ altitude: 20, velocity: 0, cacti: [{ x: DINO_X + 1, height: 5 }] })

    expect(stepDino(above, undefined, half).isOver).toBe(false)
  })

  it('dibuja suelo, dino y cactus', () => {
    expect(toScreenRects(state({ cacti: [{ x: 40, height: 5 }] })).length).toBeGreaterThan(3)
  })
})
