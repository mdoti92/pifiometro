import type { TouchEvent } from 'react'
import { ARROW_KEYS, useHorizontalHold, useWindowKeys, type Horizontal } from './input'
import { useGameLoop, type GameEngine } from './useGameLoop'

/**
 * Juegos que se manejan manteniendo la mitad izquierda/derecha de la pantalla o las flechas ← →.
 * Un toque o cualquier flecha arranca, reanuda o reinicia la partida.
 */
export function useHoldGame<S>(engine: GameEngine<S, Horizontal>) {
  const hold = useHorizontalHold()
  const { state, status, press } = useGameLoop(engine, { readInput: hold.read })

  useWindowKeys(ARROW_KEYS, () => {
    if (status !== 'running') press()
  })

  function onTouchStart(event: TouchEvent) {
    if (status !== 'running') press()
    hold.touchHandlers.onTouchStart(event)
  }

  return { state, status, press, touchHandlers: { ...hold.touchHandlers, onTouchStart } }
}
