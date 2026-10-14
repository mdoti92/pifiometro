import { describe, expect, it } from 'vitest'
import {
  GOAL_LEFT,
  GOAL_RIGHT,
  INDICATOR_MAX,
  INDICATOR_MIN,
  INITIAL_SPEED,
  KICK_TICKS,
  MISS_MARGIN,
  RESULT_TICKS,
  SPEED_INCREMENT,
  ballSprite,
  createPenalties,
  kickProgress,
  shoot,
  stepPenalties,
  toScreenRects,
  zoneOf,
  type PenaltiesState,
} from './penalties'

const THIRD = (GOAL_RIGHT - GOAL_LEFT) / 3
const keeperLeft = () => 0
const keeperRight = () => 0.99

function aimingAt(x: number, overrides: Partial<PenaltiesState> = {}): PenaltiesState {
  return { ...createPenalties(keeperLeft), indicatorX: x, ...overrides }
}

function run(state: PenaltiesState, steps: number): PenaltiesState {
  let current = state
  for (let i = 0; i < steps; i++) current = stepPenalties(current, undefined, keeperLeft)
  return current
}

describe('mira', () => {
  it('recorre el arco de lado a lado a velocidad constante, incluyendo la franja de afuera', () => {
    expect(INDICATOR_MIN).toBe(GOAL_LEFT - MISS_MARGIN)
    expect(INDICATOR_MAX).toBe(GOAL_RIGHT + MISS_MARGIN)

    expect(stepPenalties(aimingAt(20), undefined, keeperLeft).indicatorX).toBeCloseTo(20 + INITIAL_SPEED)
  })

  it('rebota en los extremos', () => {
    const next = stepPenalties(aimingAt(INDICATOR_MAX - INITIAL_SPEED / 2), undefined, keeperLeft)

    expect(next.direction).toBe(-1)
    expect(next.indicatorX).toBeLessThanOrEqual(INDICATOR_MAX)
  })
})

describe('zonas', () => {
  it('el arco se divide en tres zonas y afuera de los palos no hay zona', () => {
    expect(zoneOf(GOAL_LEFT + 1)).toBe(0)
    expect(zoneOf(GOAL_LEFT + THIRD * 1.5)).toBe(1)
    expect(zoneOf(GOAL_RIGHT - 1)).toBe(2)
    expect(zoneOf(GOAL_LEFT - 1)).toBeNull()
    expect(zoneOf(GOAL_RIGHT + 1)).toBeNull()
  })
})

describe('remate', () => {
  it('al patear arranca la animación: la mira se frena y todavía no se sabe el resultado', () => {
    const kicked = shoot(aimingAt(GOAL_RIGHT - THIRD / 2), keeperLeft)

    expect(kicked.phase).toBe('kicking')
    expect(kicked.goals).toBe(0)
    expect(kickProgress(kicked)).toBe(0)
    expect(shoot(kicked, keeperLeft)).toBe(kicked)
    expect(run(kicked, 1).indicatorX).toBe(kicked.indicatorX)
  })

  it('durante la animación la pelota vuela achicándose y el arquero se estira hacia su zona', () => {
    const kicked = shoot(aimingAt(GOAL_RIGHT - THIRD / 2), keeperLeft)
    const halfway = run(kicked, KICK_TICKS / 2)

    expect(kickProgress(halfway)).toBeCloseTo(0.5)
    expect(ballSprite(halfway).size).toBeLessThan(ballSprite(kicked).size)
    expect(halfway.keeperZone).toBe(0)
  })

  it('es gol si va dentro del arco y fuera de la zona del arquero: suma 1 y acelera la mira', () => {
    const scored = run(shoot(aimingAt(GOAL_RIGHT - THIRD / 2), keeperLeft), KICK_TICKS)

    expect(scored.phase).toBe('result')
    expect(scored.outcome).toBe('goal')
    expect(scored.goals).toBe(1)
    expect(scored.speed).toBeCloseTo(INITIAL_SPEED + SPEED_INCREMENT)
    expect(scored.isOver).toBe(false)
  })

  it('después de mostrar el gol arranca un nuevo penal', () => {
    const next = run(shoot(aimingAt(GOAL_RIGHT - 1), keeperLeft), KICK_TICKS + RESULT_TICKS)

    expect(next.phase).toBe('aiming')
    expect(next.outcome).toBeNull()
    expect(next.goals).toBe(1)
  })

  it('es atajado si va a la zona del arquero, y termina la serie al terminar la animación', () => {
    const kicked = shoot(aimingAt(GOAL_RIGHT - THIRD / 2), keeperRight)
    expect(kicked.isOver).toBe(false)

    const saved = run(kicked, KICK_TICKS)

    expect(saved.outcome).toBe('saved')
    expect(saved.keeperZone).toBe(2)
    expect(saved.isOver).toBe(true)
  })

  it('es afuera si va fuera de los palos', () => {
    const out = run(shoot(aimingAt(GOAL_LEFT - MISS_MARGIN / 2), keeperRight), KICK_TICKS)

    expect(out.outcome).toBe('out')
    expect(out.isOver).toBe(true)
  })
})

describe('dibujo', () => {
  it('mientras se apunta se ve la mira grande; al patear desaparece', () => {
    const aiming = aimingAt(30)
    const kicked = shoot(aiming, keeperLeft)

    expect(toScreenRects(aiming).length).toBeGreaterThan(toScreenRects(kicked).length - 10)
    expect(toScreenRects(aiming).some((rect) => rect.w >= 5 && rect.h === 1)).toBe(true)
  })
})
