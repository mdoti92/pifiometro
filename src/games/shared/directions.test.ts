import { describe, expect, it } from 'vitest'
import { MIN_SWIPE_DISTANCE_PX, directionFromKey, directionFromSwipe } from './input'

describe('directionFromSwipe', () => {
  it.each([
    [MIN_SWIPE_DISTANCE_PX, 0, 'right'],
    [-MIN_SWIPE_DISTANCE_PX, 0, 'left'],
    [0, MIN_SWIPE_DISTANCE_PX, 'down'],
    [0, -MIN_SWIPE_DISTANCE_PX, 'up'],
  ] as const)('dx=%i dy=%i → %s', (dx, dy, expected) => {
    expect(directionFromSwipe(dx, dy)).toBe(expected)
  })

  it('usa el eje dominante en un swipe diagonal', () => {
    expect(directionFromSwipe(80, -30)).toBe('right')
    expect(directionFromSwipe(20, -60)).toBe('up')
  })

  it('ignora movimientos cortos (un toque no es un swipe)', () => {
    expect(directionFromSwipe(MIN_SWIPE_DISTANCE_PX - 1, 0)).toBeNull()
  })
})

describe('directionFromKey', () => {
  it.each([
    ['ArrowUp', 'up'],
    ['ArrowDown', 'down'],
    ['ArrowLeft', 'left'],
    ['ArrowRight', 'right'],
  ] as const)('%s → %s', (key, expected) => {
    expect(directionFromKey(key)).toBe(expected)
  })

  it('ignora cualquier otra tecla', () => {
    expect(directionFromKey('w')).toBeNull()
    expect(directionFromKey('Enter')).toBeNull()
  })
})
