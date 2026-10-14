import { describe, expect, it } from 'vitest'
import {
  ACCELERATION,
  BUMP_SPEED_MARGIN,
  MAX_SPEED,
  RIVALS,
  STEP_MS,
  createVRally,
  racePosition,
  stepVRally,
  trackLength,
  type VRallyState,
} from './vrally'

const none = () => 0.5

function state(overrides: Partial<VRallyState> = {}): VRallyState {
  return { ...createVRally(none), ...overrides }
}

describe('rivales', () => {
  it('hay 5 rivales de colores distintos que largan adelante, con velocidades fijas distintas', () => {
    const initial = createVRally(none)

    expect(RIVALS).toHaveLength(5)
    expect(new Set(RIVALS.map((rival) => rival.color)).size).toBe(5)
    expect(new Set(RIVALS.map((rival) => rival.speed)).size).toBe(5)
    expect(RIVALS.some((rival) => rival.speed > MAX_SPEED)).toBe(true)
    expect(RIVALS.some((rival) => rival.speed < MAX_SPEED)).toBe(true)
    expect(initial.rivals.every((rival) => rival.position > initial.position)).toBe(true)
  })

  it('son siempre los mismos (no dependen del azar)', () => {
    expect(createVRally(() => 0.1).rivals).toEqual(createVRally(() => 0.9).rivals)
  })

  it('largan desde parados, aceleran como el jugador y no pasan de su velocidad fija', () => {
    const first = stepVRally(state(), 0, none)
    first.rivals.forEach((rival, index) => {
      expect(rival.speed).toBeCloseTo(ACCELERATION * (STEP_MS / 1000))
      expect(rival.position).toBeGreaterThan(state().rivals[index].position)
    })

    let later = state()
    for (let i = 0; i < 60 * 10; i++) later = stepVRally({ ...later, playerX: 0 }, 0, none)
    later.rivals.forEach((rival, index) => expect(rival.speed).toBeCloseTo(RIVALS[index].speed))
  })

  it('alcanzar a un rival de atrás baja mi velocidad a la suya menos un margen', () => {
    const rival = RIVALS[0]
    const rivalPosition = 5000
    const bumping = state({
      position: rivalPosition - 50,
      speed: MAX_SPEED,
      playerX: rival.lane,
      rivals: state().rivals.map((current, index) => (index === 0 ? { position: rivalPosition, speed: rival.speed } : current)),
    })

    const next = stepVRally(bumping, 0, none)

    expect(next.speed).toBeLessThanOrEqual(rival.speed - BUMP_SPEED_MARGIN + 1e-6)
  })

  it('pasar a un rival por otro carril no lo choca', () => {
    const rival = RIVALS[0]
    const passing = state({
      position: 4950,
      speed: MAX_SPEED,
      playerX: rival.lane > 0 ? -0.8 : 0.8,
      rivals: state().rivals.map((current, index) => (index === 0 ? { position: 5000, speed: rival.speed } : current)),
    })

    expect(stepVRally(passing, 0, none).speed).toBe(MAX_SPEED)
  })

  it('mi posición en carrera cuenta cuántos rivales van adelante', () => {
    const start = state()
    expect(racePosition(start)).toBe(RIVALS.length + 1)

    const ahead = state({ position: Math.max(...start.rivals.map((rival) => rival.position)) + 1 })
    expect(racePosition(ahead)).toBe(1)
  })

  it('al llegar queda guardada la posición final', () => {
    const fast = RIVALS.findIndex((rival) => rival.speed > MAX_SPEED)
    const almost = state({
      position: trackLength() - 1,
      speed: MAX_SPEED,
      rivals: state().rivals.map((_rival, index) => ({ position: index === fast ? trackLength() + 500 : 0, speed: 0 })),
    })

    const finished = stepVRally(almost, 0, none)

    expect(finished.isOver).toBe(true)
    expect(finished.finalPosition).toBe(2)
  })
})
