import type { ReactElement } from 'react'
import {
  FLAPPY_GAME,
  PENALTIES_GAME,
  SMALL_BEE_GAME,
  SNAKE_GAME,
  SPRING_BALL_GAME,
  TETRIS_GAME,
  type GameDefinition,
} from './catalog'
import { FlappyPage } from './flappy/FlappyPage'
import { PenaltiesPage } from './penalties/PenaltiesPage'
import { SmallBeePage } from './smallBee/SmallBeePage'
import { SnakeGamePage } from './snake/SnakeGamePage'
import { SpringBallPage } from './springBall/SpringBallPage'
import { TetrisPage } from './tetris/TetrisPage'

export const GAME_ROUTES: { game: GameDefinition; element: ReactElement }[] = [
  { game: SNAKE_GAME, element: <SnakeGamePage /> },
  { game: SPRING_BALL_GAME, element: <SpringBallPage /> },
  { game: SMALL_BEE_GAME, element: <SmallBeePage /> },
  { game: FLAPPY_GAME, element: <FlappyPage /> },
  { game: TETRIS_GAME, element: <TetrisPage /> },
  { game: PENALTIES_GAME, element: <PenaltiesPage /> },
]
