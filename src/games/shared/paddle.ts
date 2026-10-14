import { useCallback, useMemo, useRef, type TouchEvent } from 'react'
import { useHorizontalHold, type Horizontal } from './input'

/** Ángulo máximo de rebote respecto de la vertical, al pegar en el borde de la paleta. */
export const MAX_BOUNCE_ANGLE = Math.PI / 3

export interface PaddleInput {
  /** Posición del dedo como fracción del ancho del campo (0 a 1), o null si no se está arrastrando. */
  target: number | null
  hold: Horizontal
}

interface PaddleOptions {
  width: number
  fieldWidth: number
  speed: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function movePaddle(x: number, input: PaddleInput, { width, fieldWidth, speed }: PaddleOptions): number {
  const next = input.target === null ? x + input.hold * speed : input.target * fieldWidth - width / 2
  return clamp(next, 0, fieldWidth - width)
}

interface BounceParams {
  ballCenterX: number
  paddleX: number
  paddleWidth: number
  speed: number
  upward: boolean
}

export function bounceOffPaddle({ ballCenterX, paddleX, paddleWidth, speed, upward }: BounceParams) {
  const halfWidth = paddleWidth / 2
  const offset = clamp((ballCenterX - (paddleX + halfWidth)) / halfWidth, -1, 1)
  const angle = offset * MAX_BOUNCE_ANGLE
  return { vx: speed * Math.sin(angle), vy: (upward ? -1 : 1) * speed * Math.cos(angle) }
}

/** Control de paleta: arrastrar el dedo horizontalmente o mantener ← / →. */
export function usePaddleControl() {
  const { read: readHold } = useHorizontalHold()
  const target = useRef<number | null>(null)

  const read = useCallback(
    (): PaddleInput => ({ target: target.current, hold: target.current === null ? readHold() : 0 }),
    [readHold],
  )

  const touchHandlers = useMemo(() => {
    function update(event: TouchEvent) {
      const touch = event.touches[0]
      if (!touch) {
        target.current = null
        return
      }
      const bounds = event.currentTarget.getBoundingClientRect()
      target.current = clamp((touch.clientX - bounds.left) / bounds.width, 0, 1)
    }
    return { onTouchStart: update, onTouchMove: update, onTouchEnd: update, onTouchCancel: update }
  }, [])

  return { read, touchHandlers }
}
