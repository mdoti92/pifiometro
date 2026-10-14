import { useCallback, useEffect, useRef, useState } from 'react'
import { SNAKE_GAME } from '../catalog'
import { loadLocalRecord, saveLocalRecordIfBetter } from '../shared/localRecord'
import {
  createInitialState,
  queueDirection,
  tick,
  type Direction,
  type GameState,
  type RandomSource,
} from './snakeGame'

export const TICK_INTERVAL_MS = 150

export type SnakeStatus = 'idle' | 'running' | 'paused' | 'over'

interface Session {
  game: GameState
  status: SnakeStatus
}

// Vive fuera del componente para que, al salir de la pantalla y volver, la partida siga ahí en pausa.
let savedSession: Session | null = null

export function resetSavedSnakeGame() {
  savedSession = null
}

function initialSession(random: RandomSource, initialGame?: GameState): Session {
  if (savedSession) return savedSession
  return { game: initialGame ?? createInitialState(random), status: 'idle' }
}

export function useSnakeGame(random: RandomSource = Math.random, initialGame?: GameState) {
  const [session, setSession] = useState<Session>(() => initialSession(random, initialGame))
  const [storedHighScore, setStoredHighScore] = useState(() => loadLocalRecord(SNAKE_GAME.key) ?? 0)
  const sessionRef = useRef(session)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const press = useCallback(() => {
    const finishedScore = sessionRef.current.status === 'over' ? sessionRef.current.game.score : 0
    setStoredHighScore((current) => Math.max(current, finishedScore))
    setSession((current) => {
      if (current.status === 'running') return current
      if (current.status === 'over') return { game: createInitialState(random), status: 'running' }
      return { ...current, status: 'running' }
    })
  }, [random])

  const steer = useCallback(
    (direction: Direction) => {
      setSession((current) => {
        if (current.status !== 'running') return current
        return { ...current, game: queueDirection(current.game, direction) }
      })
      if (sessionRef.current.status !== 'running') press()
    },
    [press],
  )

  useEffect(() => {
    if (session.status !== 'running') return

    const interval = setInterval(() => {
      setSession((current) => {
        if (current.status !== 'running') return current
        const game = tick(current.game, random)
        return { game, status: game.isOver ? 'over' : 'running' }
      })
    }, TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [session.status, random])

  useEffect(() => {
    if (session.status === 'over') saveLocalRecordIfBetter(SNAKE_GAME.key, SNAKE_GAME.metric, session.game.score)
  }, [session.status, session.game.score])

  useEffect(() => {
    function pauseWhenHidden() {
      if (document.visibilityState !== 'hidden') return
      setSession((current) => (current.status === 'running' ? { ...current, status: 'paused' } : current))
    }

    document.addEventListener('visibilitychange', pauseWhenHidden)
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden)
  }, [])

  useEffect(
    () => () => {
      const { game, status } = sessionRef.current
      const inProgress = status === 'running' || status === 'paused'
      savedSession = inProgress ? { game, status: 'paused' } : null
    },
    [],
  )

  const finishedScore = session.status === 'over' ? session.game.score : 0
  const highScore = Math.max(storedHighScore, finishedScore)

  return { game: session.game, status: session.status, highScore, press, steer }
}
