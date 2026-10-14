import type { ReactElement } from 'react'
import {
  DINO_GAME,
  FLAPPY_GAME,
  MINESWEEPER_GAME,
  PENALTIES_GAME,
  PONG_GAME,
  SMALL_BEE_GAME,
  SNAKE_GAME,
  SPRING_BALL_GAME,
  TETRIS_GAME,
  TWENTY48_GAME,
  type GameDefinition,
} from './catalog'
import { DinoPage } from './dino/DinoPage'
import { FlappyPage } from './flappy/FlappyPage'
import { MinesweeperPage } from './minesweeper/MinesweeperPage'
import { PenaltiesPage } from './penalties/PenaltiesPage'
import { PongPage } from './pong/PongPage'
import { SmallBeePage } from './smallBee/SmallBeePage'
import { SnakeGamePage } from './snake/SnakeGamePage'
import { SpringBallPage } from './springBall/SpringBallPage'
import { TetrisPage } from './tetris/TetrisPage'
import { Twenty48Page } from './twenty48/Twenty48Page'

export const GAME_ROUTES: { game: GameDefinition; element: ReactElement }[] = [
  { game: SNAKE_GAME, element: <SnakeGamePage /> },
  { game: SPRING_BALL_GAME, element: <SpringBallPage /> },
  { game: SMALL_BEE_GAME, element: <SmallBeePage /> },
  { game: FLAPPY_GAME, element: <FlappyPage /> },
  { game: TETRIS_GAME, element: <TetrisPage /> },
  { game: PENALTIES_GAME, element: <PenaltiesPage /> },
  { game: MINESWEEPER_GAME, element: <MinesweeperPage /> },
  { game: TWENTY48_GAME, element: <Twenty48Page /> },
  { game: PONG_GAME, element: <PongPage /> },
  { game: DINO_GAME, element: <DinoPage /> },
]
