import type { Direction } from './snakeGame'

export const MIN_SWIPE_DISTANCE_PX = 24

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

export function directionFromSwipe(deltaX: number, deltaY: number): Direction | null {
  const horizontal = Math.abs(deltaX) >= Math.abs(deltaY)
  const distance = horizontal ? Math.abs(deltaX) : Math.abs(deltaY)
  if (distance < MIN_SWIPE_DISTANCE_PX) return null

  if (horizontal) return deltaX > 0 ? 'right' : 'left'
  return deltaY > 0 ? 'down' : 'up'
}

export function directionFromKey(key: string): Direction | null {
  return KEY_DIRECTIONS[key] ?? null
}
