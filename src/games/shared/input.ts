import { useCallback, useEffect, useMemo, useRef, type TouchEvent } from 'react'

export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

export const MIN_SWIPE_DISTANCE_PX = 24

export function directionFromSwipe(deltaX: number, deltaY: number): SwipeDirection | null {
  const horizontal = Math.abs(deltaX) >= Math.abs(deltaY)
  const distance = horizontal ? Math.abs(deltaX) : Math.abs(deltaY)
  if (distance < MIN_SWIPE_DISTANCE_PX) return null

  if (horizontal) return deltaX > 0 ? 'right' : 'left'
  return deltaY > 0 ? 'down' : 'up'
}

const ARROW_DIRECTIONS: Record<string, SwipeDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

export const ARROW_KEYS = Object.keys(ARROW_DIRECTIONS)

export function directionFromKey(key: string): SwipeDirection | null {
  return ARROW_DIRECTIONS[key] ?? null
}

/**
 * Escucha teclas en toda la ventana mientras el juego está montado. Evita el scroll de la página
 * con las teclas que maneja y deja de escuchar al desmontar.
 */
export function useWindowKeys(
  keys: string[],
  onKeyDown: (key: string, repeat: boolean) => void,
  onKeyUp?: (key: string) => void,
) {
  const handlers = useRef({ onKeyDown, onKeyUp })
  const keyList = keys.join('|')

  useEffect(() => {
    handlers.current = { onKeyDown, onKeyUp }
  })

  useEffect(() => {
    const handled = new Set(keyList.split('|'))

    function handleKeyDown(event: KeyboardEvent) {
      if (!handled.has(event.key)) return
      event.preventDefault()
      handlers.current.onKeyDown(event.key, event.repeat)
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (handled.has(event.key)) handlers.current.onKeyUp?.(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [keyList])
}

interface SwipeCallbacks {
  onSwipe: (direction: SwipeDirection) => void
  onTap: () => void
}

export function useSwipeHandlers({ onSwipe, onTap }: SwipeCallbacks) {
  const start = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0]
    start.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const onTouchEnd = useCallback(
    (event: TouchEvent) => {
      const origin = start.current
      start.current = null
      if (!origin) return

      const touch = event.changedTouches[0]
      const direction = directionFromSwipe(touch.clientX - origin.x, touch.clientY - origin.y)
      if (direction) onSwipe(direction)
      else onTap()
    },
    [onSwipe, onTap],
  )

  return { onTouchStart, onTouchEnd }
}

export type Horizontal = -1 | 0 | 1

/**
 * Dirección horizontal mantenida: flechas ← / → o tocar y mantener la mitad izquierda/derecha
 * del área. Se lee con read() en cada paso del juego.
 */
export function useHorizontalHold() {
  const keys = useRef({ left: false, right: false })
  const touch = useRef<Horizontal>(0)

  useWindowKeys(
    ['ArrowLeft', 'ArrowRight'],
    (key) => {
      if (key === 'ArrowLeft') keys.current.left = true
      else keys.current.right = true
    },
    (key) => {
      if (key === 'ArrowLeft') keys.current.left = false
      else keys.current.right = false
    },
  )

  const read = useCallback((): Horizontal => {
    if (touch.current !== 0) return touch.current
    const { left, right } = keys.current
    if (left === right) return 0
    return left ? -1 : 1
  }, [])

  const touchHandlers = useMemo(() => {
    function update(event: TouchEvent) {
      const active = event.touches[0]
      if (!active) {
        touch.current = 0
        return
      }
      const bounds = event.currentTarget.getBoundingClientRect()
      touch.current = active.clientX - bounds.left < bounds.width / 2 ? -1 : 1
    }
    return { onTouchStart: update, onTouchMove: update, onTouchEnd: update, onTouchCancel: update }
  }, [])

  return { read, touchHandlers }
}
