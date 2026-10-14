import { act } from '@testing-library/react'
import { vi } from 'vitest'
import { COUNTDOWN_SECONDS } from '../games/shared/useGameLoop'

const MS_PER_SECOND = 1000

/** Deja pasar la cuenta regresiva de arranque de un juego (requiere vi.useFakeTimers). */
export function finishCountdown() {
  for (let second = 0; second < COUNTDOWN_SECONDS; second++) {
    act(() => {
      vi.advanceTimersByTime(MS_PER_SECOND)
    })
  }
}
