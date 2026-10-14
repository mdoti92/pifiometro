import { useCallback, useRef } from 'react'
import { useWindowKeys } from '../shared/input'
import type { AbyssInput } from './deepAbyss'

const MOVE_KEYS = ['ArrowLeft', 'ArrowRight']
const JUMP_KEYS = [' ', 'ArrowUp']

export type ButtonKind = 'left' | 'right' | 'jump'

/**
 * Controles de plataformas: botones en pantalla (cada uno con su propio dedo, multitouch) o teclado.
 * El salto queda pendiente hasta el próximo paso del juego, que lo usa si el personaje está apoyado.
 */
export function useAbyssControls(onAnyInput: () => void) {
  const held = useRef({ keyLeft: false, keyRight: false, buttonLeft: false, buttonRight: false })
  const jumpQueued = useRef(false)

  useWindowKeys(
    [...MOVE_KEYS, ...JUMP_KEYS],
    (key, repeat) => {
      onAnyInput()
      if (key === 'ArrowLeft') held.current.keyLeft = true
      else if (key === 'ArrowRight') held.current.keyRight = true
      else if (!repeat) jumpQueued.current = true
    },
    (key) => {
      if (key === 'ArrowLeft') held.current.keyLeft = false
      else if (key === 'ArrowRight') held.current.keyRight = false
    },
  )

  const read = useCallback((): AbyssInput => {
    const { keyLeft, keyRight, buttonLeft, buttonRight } = held.current
    const left = keyLeft || buttonLeft
    const right = keyRight || buttonRight
    const jump = jumpQueued.current
    jumpQueued.current = false
    return { move: left === right ? 0 : left ? -1 : 1, jump }
  }, [])

  const setButton = useCallback(
    (kind: ButtonKind, pressed: boolean) => {
      if (pressed) onAnyInput()
      if (kind === 'left') held.current.buttonLeft = pressed
      else if (kind === 'right') held.current.buttonRight = pressed
      else if (pressed) jumpQueued.current = true
    },
    [onAnyInput],
  )

  return { read, setButton }
}

