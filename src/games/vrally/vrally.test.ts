import { describe, expect, it } from 'vitest'
import {
  CRASH_SPEED,
  MAX_SPEED,
  OFFROAD_MAX_SPEED,
  SEGMENT_LENGTH,
  STEP_MS,
  TRACK,
  createVRally,
  segmentAt,
  stepVRally,
  timeInTenths,
  trackLength,
  type VRallyState,
} from './vrally'

const none = () => 0.5

function state(overrides: Partial<VRallyState> = {}): VRallyState {
  return { ...createVRally(none), ...overrides }
}

function run(initial: VRallyState, steps: number, input: -1 | 0 | 1 = 0): VRallyState {
  let current = initial
  for (let i = 0; i < steps; i++) current = stepVRally(current, input, none)
  return current
}

function findSegment(predicate: (curve: number) => boolean): number {
  return TRACK.segments.findIndex((segment) => predicate(segment.curve))
}

describe('tramo', () => {
  it('es un recorrido fijo de largo constante, con rectas y curvas a ambos lados', () => {
    expect(trackLength()).toBe(TRACK.segments.length * SEGMENT_LENGTH)
    expect(TRACK.segments.some((segment) => segment.curve === 0)).toBe(true)
    expect(TRACK.segments.some((segment) => segment.curve < 0)).toBe(true)
    expect(TRACK.segments.some((segment) => segment.curve > 0)).toBe(true)
    expect(new Set(TRACK.segments.map((segment) => Math.abs(segment.curve))).size).toBeGreaterThan(2)
    expect(TRACK.trees.length).toBeGreaterThan(0)
  })

  it('es el mismo para todos (no depende del azar)', () => {
    expect(createVRally(() => 0.1).position).toBe(createVRally(() => 0.9).position)
  })
})

describe('stepVRally', () => {
  it('acelera solo hasta la velocidad máxima y el cronómetro corre', () => {
    const after = run(state(), 60 * 20)

    expect(after.speed).toBe(MAX_SPEED)
    expect(after.elapsedMs).toBeCloseTo(60 * 20 * STEP_MS)
    expect(after.position).toBeGreaterThan(0)
  })

  it('se desplaza hacia el lado apretado, más cuanto más rápido va', () => {
    const slow = stepVRally(state({ speed: MAX_SPEED / 4 }), 1, none)
    const fast = stepVRally(state({ speed: MAX_SPEED }), 1, none)

    expect(slow.playerX).toBeGreaterThan(0)
    expect(fast.playerX).toBeGreaterThan(slow.playerX)
  })

  it('la fuerza centrífuga empuja hacia el exterior de la curva', () => {
    const rightCurve = findSegment((curve) => curve > 0)
    const leftCurve = findSegment((curve) => curve < 0)

    const inRight = stepVRally(state({ speed: MAX_SPEED, position: rightCurve * SEGMENT_LENGTH }), 0, none)
    const inLeft = stepVRally(state({ speed: MAX_SPEED, position: leftCurve * SEGMENT_LENGTH }), 0, none)

    expect(inRight.playerX).toBeLessThan(0)
    expect(inLeft.playerX).toBeGreaterThan(0)
  })

  it('en el pasto la velocidad baja hasta un máximo reducido', () => {
    const offroad = run(state({ speed: MAX_SPEED, playerX: 1.3 }), 240)

    expect(offroad.speed).toBeLessThanOrEqual(OFFROAD_MAX_SPEED + 1e-6)
  })

  it('chocar un árbol deja la velocidad casi en cero', () => {
    const tree = TRACK.trees[0]
    const next = stepVRally(
      state({ speed: MAX_SPEED, position: tree.segment * SEGMENT_LENGTH - 1, playerX: tree.offset }),
      0,
      none,
    )

    expect(next.speed).toBeLessThanOrEqual(CRASH_SPEED)
  })

  it('al cruzar la llegada termina y frena el cronómetro', () => {
    const almost = state({ speed: MAX_SPEED, position: trackLength() - 1, elapsedMs: 61234 })

    const finished = stepVRally(almost, 0, none)

    expect(finished.isOver).toBe(true)
    expect(stepVRally(finished, 0, none).elapsedMs).toBe(finished.elapsedMs)
  })
})

describe('utilidades', () => {
  it('segmentAt devuelve el segmento de una posición', () => {
    expect(segmentAt(SEGMENT_LENGTH * 2 + 1).index).toBe(2)
  })

  it('el tiempo se mide en décimas', () => {
    expect(timeInTenths(61234)).toBe(612)
  })
})
