import type { ReactElement } from 'react'
import { SNAKE_GAME, SPRING_BALL_GAME, type GameDefinition } from './catalog'
import { SnakeGamePage } from './snake/SnakeGamePage'
import { SpringBallPage } from './springBall/SpringBallPage'

export const GAME_ROUTES: { game: GameDefinition; element: ReactElement }[] = [
  { game: SNAKE_GAME, element: <SnakeGamePage /> },
  { game: SPRING_BALL_GAME, element: <SpringBallPage /> },
]
