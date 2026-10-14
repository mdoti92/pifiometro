import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COUNTDOWN_SECONDS, resetSavedGameSessions } from '../shared/useGameLoop'
import { createInitialState, type GameState } from './snakeGame'
import { TICK_INTERVAL_MS, useSnakeGame } from './useSnakeGame'

const alwaysFirst = () => 0

function advanceTicks(count: number) {
  act(() => {
    vi.advanceTimersByTime(TICK_INTERVAL_MS * count)
  })
}

function startGame(press: () => void) {
  act(() => press())
  for (let second = 0; second < COUNTDOWN_SECONDS; second++) {
    act(() => {
      vi.advanceTimersByTime(1000)
    })
  }
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  resetSavedGameSessions()
  setVisibility('visible')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSnakeGame', () => {
  it('arranca en espera y no se mueve hasta que el jugador toca', () => {
    const { result } = renderHook(() => useSnakeGame(alwaysFirst))
    const initialHead = result.current.game.snake[0]

    advanceTicks(3)

    expect(result.current.status).toBe('idle')
    expect(result.current.game.snake[0]).toEqual(initialHead)
  })

  it('al tocar arranca y avanza una celda por tick', () => {
    const { result } = renderHook(() => useSnakeGame(alwaysFirst))
    const initialHead = result.current.game.snake[0]

    startGame(result.current.press)
    advanceTicks(2)

    expect(result.current.status).toBe('running')
    expect(result.current.game.snake[0]).toEqual({ x: initialHead.x + 2, y: initialHead.y })
  })

  it('una dirección con el juego en espera arranca la cuenta regresiva', () => {
    const { result } = renderHook(() => useSnakeGame(alwaysFirst))

    act(() => result.current.steer('up'))

    expect(result.current.status).toBe('countdown')
  })

  it('una dirección durante la partida cambia el rumbo en el próximo tick', () => {
    const { result } = renderHook(() => useSnakeGame(alwaysFirst))
    startGame(result.current.press)
    const head = result.current.game.snake[0]

    act(() => result.current.steer('down'))
    advanceTicks(1)

    expect(result.current.game.snake[0]).toEqual({ x: head.x, y: head.y + 1 })
  })

  it('se pausa al pasar a segundo plano y se reanuda con un toque', () => {
    const { result } = renderHook(() => useSnakeGame(alwaysFirst))
    startGame(result.current.press)

    setVisibility('hidden')
    const pausedHead = result.current.game.snake[0]
    advanceTicks(3)

    expect(result.current.status).toBe('paused')
    expect(result.current.game.snake[0]).toEqual(pausedHead)

    setVisibility('visible')
    startGame(result.current.press)

    expect(result.current.status).toBe('running')
  })

  it('al salir de la pantalla deja la partida en pausa y la recupera al volver', () => {
    const first = renderHook(() => useSnakeGame(alwaysFirst))
    startGame(first.result.current.press)
    advanceTicks(2)
    const headWhenLeaving = first.result.current.game.snake[0]

    first.unmount()
    const second = renderHook(() => useSnakeGame(alwaysFirst))

    expect(second.result.current.status).toBe('paused')
    expect(second.result.current.game.snake[0]).toEqual(headWhenLeaving)
  })

  it('al chocar termina la partida', () => {
    const aboutToCrash: GameState = {
      ...createInitialState(alwaysFirst),
      snake: [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }],
      direction: 'down',
      food: { x: 0, y: 0 },
      score: 4,
    }
    const { result } = renderHook(() => useSnakeGame(alwaysFirst, aboutToCrash))

    startGame(result.current.press)
    advanceTicks(1)

    expect(result.current.status).toBe('over')
  })

  it('después del game over un toque arranca una partida nueva', () => {
    const finished: GameState = { ...createInitialState(alwaysFirst), isOver: true, score: 2 }
    const { result } = renderHook(() => useSnakeGame(alwaysFirst, finished))
    startGame(result.current.press)
    advanceTicks(1)
    expect(result.current.status).toBe('over')

    startGame(result.current.press)

    expect(result.current.status).toBe('running')
    expect(result.current.game.score).toBe(0)
  })
})
