import type { TouchEvent } from 'react'
import { ARROW_KEYS, useHorizontalHold, useWindowKeys, type Horizontal } from './input'
import { useGameLoop, type GameEngine } from './useGameLoop'

type TouchHandler = (event: TouchEvent) => void

interface GameControl<I> {
  read: () => I
  touchHandlers: { onTouchStart: TouchHandler; onTouchMove: TouchHandler; onTouchEnd: TouchHandler; onTouchCancel: TouchHandler }
}

/**
 * Juegos que leen un control continuo en cada paso (mantener un lado, arrastrar una paleta).
 * Un toque o cualquier flecha arranca, reanuda o reinicia la partida.
 */
export function useControlledGame<S, I>(engine: GameEngine<S, I>, control: GameControl<I>) {
  const { state, status, countdown, press, act } = useGameLoop(engine, { readInput: control.read })

  useWindowKeys(ARROW_KEYS, () => {
    if (status !== 'running') press()
  })

  function onTouchStart(event: TouchEvent) {
    if (status !== 'running') press()
    control.touchHandlers.onTouchStart(event)
  }

  return { state, status, countdown, press, act, touchHandlers: { ...control.touchHandlers, onTouchStart } }
}

/** Mantener la mitad izquierda/derecha de la pantalla o las flechas ← →. */
export function useHoldGame<S>(engine: GameEngine<S, Horizontal>) {
  return useControlledGame(engine, useHorizontalHold())
}
