import { useCallback } from 'react'
import { useWindowKeys } from './input'
import { useGameLoop, type GameEngine } from './useGameLoop'

export const TAP_KEYS = [' ', 'ArrowUp']

interface TapGameOptions<S> {
  /** Acción del jugador en cada toque con la partida en curso (aletear, saltar, patear). */
  action: (state: S) => S
  /** Si el toque que arranca la partida también ejecuta la acción. */
  actOnStart?: boolean
  keys?: string[]
}

/** Juegos de un solo botón: toque en la pantalla, espacio o ↑. */
export function useTapGame<S>(engine: GameEngine<S>, { action, actOnStart = false, keys = TAP_KEYS }: TapGameOptions<S>) {
  const { state, status, press, act } = useGameLoop(engine)

  const tap = useCallback(() => {
    if (status === 'running') {
      act(action)
      return
    }
    press()
    if (actOnStart) act(action)
  }, [status, act, press, action, actOnStart])

  useWindowKeys(keys, (_key, repeat) => {
    if (!repeat) tap()
  })

  return { state, status, tap, touchHandlers: { onTouchStart: tap } }
}
