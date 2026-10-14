import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetSavedGameSessions, useGameLoop, type GameEngine } from './useGameLoop'

interface CounterState {
  ticks: number
  boost: number
  over: boolean
}

const TICK_MS = 100

const counterEngine: GameEngine<CounterState> = {
  key: 'counter',
  create: () => ({ ticks: 0, boost: 0, over: false }),
  step: (state) => ({ ...state, ticks: state.ticks + 1, over: state.ticks + 1 >= 5 }),
  isOver: (state) => state.over,
  intervalMs: () => TICK_MS,
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
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

describe('useGameLoop', () => {
  it('arranca en espera sin avanzar', () => {
    const { result } = renderHook(() => useGameLoop(counterEngine))

    advance(TICK_MS * 3)

    expect(result.current.status).toBe('idle')
    expect(result.current.state.ticks).toBe(0)
  })

  it('al tocar arranca y avanza un paso por intervalo', () => {
    const { result } = renderHook(() => useGameLoop(counterEngine))

    act(() => result.current.press())
    advance(TICK_MS * 2)

    expect(result.current.status).toBe('running')
    expect(result.current.state.ticks).toBe(2)
  })

  it('respeta un intervalo que depende del estado', () => {
    const variable: GameEngine<CounterState> = { ...counterEngine, intervalMs: (state) => (state.ticks >= 1 ? 50 : 100) }
    const { result } = renderHook(() => useGameLoop(variable))

    act(() => result.current.press())
    advance(100)
    advance(100)

    expect(result.current.state.ticks).toBe(3)
  })

  it('act modifica el estado solo con la partida en curso', () => {
    const { result } = renderHook(() => useGameLoop(counterEngine))

    act(() => result.current.act((state) => ({ ...state, boost: 1 })))
    expect(result.current.state.boost).toBe(0)

    act(() => {
      result.current.press()
      result.current.act((state) => ({ ...state, boost: 1 }))
    })
    expect(result.current.state.boost).toBe(1)
  })

  it('termina cuando el motor dice que terminó y un toque arranca una partida nueva', () => {
    const { result } = renderHook(() => useGameLoop(counterEngine))
    act(() => result.current.press())

    advance(TICK_MS * 5)
    expect(result.current.status).toBe('over')

    act(() => result.current.press())
    expect(result.current.status).toBe('running')
    expect(result.current.state.ticks).toBe(0)
  })

  it('se pausa al pasar a segundo plano y se reanuda con un toque', () => {
    const { result } = renderHook(() => useGameLoop(counterEngine))
    act(() => result.current.press())

    setVisibility('hidden')
    advance(TICK_MS * 3)

    expect(result.current.status).toBe('paused')
    expect(result.current.state.ticks).toBe(0)

    act(() => result.current.press())
    expect(result.current.status).toBe('running')
  })

  it('pause() pausa una partida en curso', () => {
    const { result } = renderHook(() => useGameLoop(counterEngine))
    act(() => result.current.press())

    act(() => result.current.pause())

    expect(result.current.status).toBe('paused')
  })

  it('al salir de la pantalla guarda la partida en pausa y la recupera al volver', () => {
    const first = renderHook(() => useGameLoop(counterEngine))
    act(() => first.result.current.press())
    advance(TICK_MS * 2)

    first.unmount()
    const second = renderHook(() => useGameLoop(counterEngine))

    expect(second.result.current.status).toBe('paused')
    expect(second.result.current.state.ticks).toBe(2)
  })

  it('las partidas guardadas son independientes por juego', () => {
    const first = renderHook(() => useGameLoop(counterEngine))
    act(() => first.result.current.press())
    advance(TICK_MS * 2)
    first.unmount()

    const other = renderHook(() => useGameLoop({ ...counterEngine, key: 'otro' }))

    expect(other.result.current.status).toBe('idle')
  })

  it('acepta un estado inicial', () => {
    const { result } = renderHook(() =>
      useGameLoop(counterEngine, { initialState: { ticks: 4, boost: 0, over: false } }),
    )

    act(() => result.current.press())
    advance(TICK_MS)

    expect(result.current.status).toBe('over')
  })
})
