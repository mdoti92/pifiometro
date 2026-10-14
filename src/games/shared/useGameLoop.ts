import { useCallback, useEffect, useRef, useState } from 'react'

/** countdown: cuenta regresiva antes de arrancar o reanudar; los toques no cuentan como jugada. */
export type GameStatus = 'idle' | 'countdown' | 'running' | 'paused' | 'over'

/** Devuelve un número en [0, 1), igual que Math.random; inyectable para tests. */
export type RandomSource = () => number

export interface GameEngine<S, I = undefined> {
  key: string
  create: (random: RandomSource) => S
  step: (state: S, input: I, random: RandomSource) => S
  isOver: (state: S) => boolean
  intervalMs: (state: S) => number
  /**
   * Avanza con requestAnimationFrame dando pasos fijos de intervalMs (física independiente del
   * framerate), para juegos que necesitan animación fluida.
   */
  animationFrame?: boolean
}

// Si una pestaña vuelve de estar congelada no se recupera de golpe todo el tiempo perdido.
const MAX_FRAME_GAP_MS = 250
const MAX_STEPS_PER_FRAME = 8

// En el celular el toque que arranca la partida no tiene que tomarse como jugada.
export const COUNTDOWN_SECONDS = 3
const COUNTDOWN_TICK_MS = 1000

interface GameLoopOptions<S, I> {
  random?: RandomSource
  initialState?: S
  readInput?: () => I
  countdownSeconds?: number
}

interface Session<S> {
  state: S
  status: GameStatus
  countdown: number
}

// Viven fuera de los componentes para que, al salir de la pantalla de un juego y volver,
// la partida siga ahí en pausa.
const savedSessions = new Map<string, Session<unknown>>()

export function resetSavedGameSessions() {
  savedSessions.clear()
}

export function useGameLoop<S, I = undefined>(engine: GameEngine<S, I>, options: GameLoopOptions<S, I> = {}) {
  const random = options.random ?? Math.random
  const countdownSeconds = options.countdownSeconds ?? COUNTDOWN_SECONDS
  const engineRef = useRef(engine)
  const randomRef = useRef(random)
  const readInputRef = useRef(options.readInput)

  useEffect(() => {
    engineRef.current = engine
    randomRef.current = random
    readInputRef.current = options.readInput
  })

  const [session, setSession] = useState<Session<S>>(() => {
    const saved = savedSessions.get(engine.key) as Session<S> | undefined
    if (saved) return saved
    return { state: options.initialState ?? engine.create(random), status: 'idle', countdown: 0 }
  })
  const sessionRef = useRef(session)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const press = useCallback(() => {
    setSession((current) => {
      if (current.status === 'running' || current.status === 'countdown') return current
      const state = current.status === 'over' ? engineRef.current.create(randomRef.current) : current.state
      return countdownSeconds > 0
        ? { state, status: 'countdown', countdown: countdownSeconds }
        : { state, status: 'running', countdown: 0 }
    })
  }, [countdownSeconds])

  const pause = useCallback(() => {
    setSession((current) =>
      current.status === 'running' || current.status === 'countdown' ? { ...current, status: 'paused' } : current,
    )
  }, [])

  const act = useCallback((update: (state: S) => S) => {
    setSession((current) => {
      if (current.status !== 'running') return current
      const state = update(current.state)
      return { ...current, state, status: engineRef.current.isOver(state) ? 'over' : 'running' }
    })
  }, [])

  const interval = engine.intervalMs(session.state)

  const advance = useCallback((steps: number) => {
    setSession((current) => {
      if (current.status !== 'running') return current
      const currentEngine = engineRef.current
      let state = current.state
      for (let step = 0; step < steps && !currentEngine.isOver(state); step++) {
        state = currentEngine.step(state, readInputRef.current?.() as I, randomRef.current)
      }
      return { ...current, state, status: currentEngine.isOver(state) ? 'over' : 'running' }
    })
  }, [])

  useEffect(() => {
    if (session.status !== 'countdown') return
    const timer = setTimeout(() => {
      setSession((current) => {
        if (current.status !== 'countdown') return current
        const countdown = current.countdown - 1
        return countdown > 0 ? { ...current, countdown } : { ...current, status: 'running', countdown: 0 }
      })
    }, COUNTDOWN_TICK_MS)
    return () => clearTimeout(timer)
  }, [session.status, session.countdown])

  const usesAnimationFrame = Boolean(engine.animationFrame)

  useEffect(() => {
    if (session.status !== 'running') return

    if (!usesAnimationFrame) {
      const timer = setInterval(() => advance(1), interval)
      return () => clearInterval(timer)
    }

    let frame = 0
    let last = performance.now()
    let accumulated = 0
    const onFrame = (now: number) => {
      accumulated += Math.min(now - last, MAX_FRAME_GAP_MS)
      last = now
      const steps = Math.min(Math.floor(accumulated / interval), MAX_STEPS_PER_FRAME)
      accumulated -= steps * interval
      if (steps > 0) advance(steps)
      frame = requestAnimationFrame(onFrame)
    }
    frame = requestAnimationFrame(onFrame)
    return () => cancelAnimationFrame(frame)
  }, [session.status, interval, usesAnimationFrame, advance])

  useEffect(() => {
    function pauseWhenHidden() {
      if (document.visibilityState === 'hidden') pause()
    }

    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden)
  }, [pause])

  useEffect(() => {
    const key = engine.key
    return () => {
      const { state, status } = sessionRef.current
      const inProgress = status === 'running' || status === 'paused' || status === 'countdown'
      if (inProgress) savedSessions.set(key, { state, status: 'paused', countdown: 0 })
      else savedSessions.delete(key)
    }
  }, [engine.key])

  return { state: session.state, status: session.status, countdown: session.countdown, press, pause, act }
}
