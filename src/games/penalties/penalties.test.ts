import { describe, expect, it } from 'vitest'
import {
  GOAL_LEFT,
  GOAL_RIGHT,
  INDICATOR_MAX,
  INDICATOR_MIN,
  INITIAL_SPEED,
  MISS_MARGIN,
  RESULT_TICKS,
  SPEED_INCREMENT,
  createPenalties,
  shoot,
  stepPenalties,
  toScreenRects,
  type PenaltiesState,
} from './penalties'

const THIRD = (GOAL_RIGHT - GOAL_LEFT) / 3
const keeperLeft = () => 0
const keeperRight = () => 0.99

function aimingAt(x: number, overrides: Partial<PenaltiesState> = {}): PenaltiesState {
  return { ...createPenalties(keeperLeft), indicatorX: x, ...overrides }
}

describe('indicador', () => {
  it('recorre el arco de lado a lado a velocidad constante, incluyendo la franja de afuera', () => {
    expect(INDICATOR_MIN).toBe(GOAL_LEFT - MISS_MARGIN)
    expect(INDICATOR_MAX).toBe(GOAL_RIGHT + MISS_MARGIN)

    const state = aimingAt(20)
    expect(stepPenalties(state, undefined, keeperLeft).indicatorX).toBeCloseTo(20 + INITIAL_SPEED)
  })

  it('rebota en los extremos', () => {
    const state = aimingAt(INDICATOR_MAX - INITIAL_SPEED / 2)

    const next = stepPenalties(state, undefined, keeperLeft)

    expect(next.direction).toBe(-1)
    expect(next.indicatorX).toBeLessThanOrEqual(INDICATOR_MAX)
  })
})

describe('patear', () => {
  it('es gol si va dentro del arco y fuera del tercio del golero, suma 1 y acelera', () => {
    const state = aimingAt(GOAL_RIGHT - THIRD / 2)

    const next = shoot(state, keeperLeft)

    expect(next.outcome).toBe('goal')
    expect(next.goals).toBe(1)
    expect(next.speed).toBeCloseTo(INITIAL_SPEED + SPEED_INCREMENT)
    expect(next.isOver).toBe(false)
  })

  it('es atajado si cae en el tercio donde se tiró el golero y termina la serie', () => {
    const next = shoot(aimingAt(GOAL_RIGHT - THIRD / 2), keeperRight)

    expect(next.outcome).toBe('saved')
    expect(next.keeperThird).toBe(2)
    expect(next.isOver).toBe(true)
  })

  it('es afuera si cae fuera de los palos', () => {
    const next = shoot(aimingAt(GOAL_LEFT - MISS_MARGIN / 2), keeperRight)

    expect(next.outcome).toBe('out')
    expect(next.isOver).toBe(true)
  })

  it('no se puede patear mientras se muestra el resultado', () => {
    const afterGoal = shoot(aimingAt(GOAL_RIGHT - 1), keeperLeft)

    expect(shoot(afterGoal, keeperLeft)).toBe(afterGoal)
  })

  it('después de mostrar el gol arranca un nuevo penal', () => {
    let state = shoot(aimingAt(GOAL_RIGHT - 1), keeperLeft)
    for (let i = 0; i < RESULT_TICKS; i++) state = stepPenalties(state, undefined, keeperLeft)

    expect(state.phase).toBe('aiming')
    expect(state.outcome).toBeNull()
    expect(state.goals).toBe(1)
  })
})

describe('toScreenRects', () => {
  it('dibuja arco, golero, pelota e indicador', () => {
    expect(toScreenRects(createPenalties(keeperLeft)).length).toBeGreaterThan(4)
  })
})
