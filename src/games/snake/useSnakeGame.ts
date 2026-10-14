import { useCallback } from 'react'
import { SNAKE_GAME } from '../catalog'
import { useGameLoop, type GameEngine } from '../shared/useGameLoop'
import { createInitialState, queueDirection, tick, type Direction, type GameState, type RandomSource } from './snakeGame'

export const TICK_INTERVAL_MS = 150

const SNAKE_ENGINE: GameEngine<GameState> = {
  key: SNAKE_GAME.key,
  create: createInitialState,
  step: (state, _input, random) => tick(state, random),
  isOver: (state) => state.isOver,
  intervalMs: () => TICK_INTERVAL_MS,
}

export function useSnakeGame(random: RandomSource = Math.random, initialGame?: GameState) {
  const { state, status, press, act } = useGameLoop(SNAKE_ENGINE, { random, initialState: initialGame })

  const steer = useCallback(
    (direction: Direction) => {
      if (status !== 'running') press()
      else act((current) => queueDirection(current, direction))
    },
    [status, press, act],
  )

  return { game: state, status, press, steer }
}
