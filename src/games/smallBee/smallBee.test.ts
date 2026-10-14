import { describe, expect, it } from 'vitest'
import {
  BEE_SPEED,
  BEE_WIDTH,
  BEE_Y,
  BUG_POINTS,
  FIRE_INTERVAL_TICKS,
  INITIAL_LIVES,
  LEVELS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  createSmallBee,
  currentLevel,
  stepSmallBee,
  toScreenRects,
  type SmallBeeState,
} from './smallBee'

const alwaysHalf = () => 0.5

function state(overrides: Partial<SmallBeeState> = {}): SmallBeeState {
  return { ...createSmallBee(alwaysHalf), ...overrides }
}

describe('createSmallBee', () => {
  it('arranca con la abeja abajo al centro, 3 vidas y sin bichos', () => {
    const initial = createSmallBee(alwaysHalf)

    expect(initial.beeX).toBe((VIEW_WIDTH - BEE_WIDTH) / 2)
    expect(initial.lives).toBe(INITIAL_LIVES)
    expect(initial.bugs).toEqual([])
    expect(initial.score).toBe(0)
  })
})

describe('stepSmallBee', () => {
  it('mueve la abeja hacia el lado apretado sin salirse de los bordes', () => {
    expect(stepSmallBee(state({ beeX: 10 }), 1, alwaysHalf).beeX).toBe(10 + BEE_SPEED)
    expect(stepSmallBee(state({ beeX: 0 }), -1, alwaysHalf).beeX).toBe(0)
    expect(stepSmallBee(state({ beeX: VIEW_WIDTH - BEE_WIDTH }), 1, alwaysHalf).beeX).toBe(VIEW_WIDTH - BEE_WIDTH)
  })

  it('dispara un aguijón automáticamente cada intervalo fijo', () => {
    let current = state()
    for (let i = 0; i < FIRE_INTERVAL_TICKS; i++) current = stepSmallBee(current, 0, alwaysHalf)

    expect(current.stingers.length).toBe(1)
  })

  it('hace bajar bichos desde arriba en posiciones al azar', () => {
    let current = state()
    for (let i = 0; i < LEVELS[0].spawnEveryTicks; i++) current = stepSmallBee(current, 0, () => 0.25)

    expect(current.bugs.length).toBeGreaterThan(0)
    expect(current.bugs[0].y).toBeLessThan(VIEW_HEIGHT / 2)
  })

  it('un aguijón que toca un bicho elimina a ambos y suma puntos', () => {
    const current = state({ bugs: [{ x: 20, y: 30 }], stingers: [{ x: 21, y: 32 }] })

    const next = stepSmallBee(current, 0, alwaysHalf)

    expect(next.bugs).toHaveLength(0)
    expect(next.stingers).toHaveLength(0)
    expect(next.score).toBe(BUG_POINTS)
  })

  it('un bicho que llega abajo quita una vida y desaparece', () => {
    const current = state({ beeX: 0, bugs: [{ x: 40, y: VIEW_HEIGHT - 1 }] })

    const next = stepSmallBee(current, 0, alwaysHalf)

    expect(next.lives).toBe(INITIAL_LIVES - 1)
    expect(next.bugs).toHaveLength(0)
  })

  it('un bicho que toca a la abeja quita una vida', () => {
    const current = state({ beeX: 20, bugs: [{ x: 20, y: BEE_Y - 2 }] })

    const next = stepSmallBee(current, 0, alwaysHalf)

    expect(next.lives).toBe(INITIAL_LIVES - 1)
  })

  it('con 0 vidas termina la partida', () => {
    const current = state({ lives: 1, beeX: 0, bugs: [{ x: 40, y: VIEW_HEIGHT - 1 }] })

    expect(stepSmallBee(current, 0, alwaysHalf).isOver).toBe(true)
  })
})

describe('currentLevel', () => {
  it('con más puntaje los bichos bajan más rápido y aparecen más seguido', () => {
    const first = currentLevel(0)
    const later = currentLevel(LEVELS[LEVELS.length - 1].minScore)

    expect(later.fallSpeed).toBeGreaterThan(first.fallSpeed)
    expect(later.spawnEveryTicks).toBeLessThan(first.spawnEveryTicks)
  })
})

describe('toScreenRects', () => {
  it('dibuja abeja, bichos y aguijones', () => {
    const rects = toScreenRects(state({ bugs: [{ x: 1, y: 1 }], stingers: [{ x: 5, y: 5 }] }))

    expect(rects.length).toBeGreaterThan(3)
  })
})
