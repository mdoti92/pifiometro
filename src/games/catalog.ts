import type { GameMetric } from './ranking/rankingLogic'

export interface GameDefinition {
  key: string
  name: string
  description: string
  path: string
  metric: GameMetric
  formatValue?: (value: number) => string
}

export const SNAKE_GAME: GameDefinition = {
  key: 'snake',
  name: 'Viborita',
  description: 'La del Nokia 1100, de toda la vida',
  path: '/games/snake',
  metric: 'highest',
}

export const SPRING_BALL_GAME: GameDefinition = {
  key: 'spring-ball',
  name: 'Spring Ball',
  description: 'La pelotita saltarina del Motorola C115',
  path: '/games/spring-ball',
  metric: 'highest',
}

export const SMALL_BEE_GAME: GameDefinition = {
  key: 'small-bee',
  name: 'Small Bee',
  description: 'La abejita a los aguijonazos, también del C115',
  path: '/games/small-bee',
  metric: 'highest',
}

export const FLAPPY_GAME: GameDefinition = {
  key: 'flappy',
  name: 'Flappy Bird',
  description: 'Pasá entre las tuberías sin chocar',
  path: '/games/flappy',
  metric: 'highest',
}

export const TETRIS_GAME: GameDefinition = {
  key: 'tetris',
  name: 'Tetris',
  description: 'Encajá las piezas y borrá líneas',
  path: '/games/tetris',
  metric: 'highest',
}

export const PENALTIES_GAME: GameDefinition = {
  key: 'penalties',
  name: 'Penales',
  description: 'Muerte súbita desde los once metros',
  path: '/games/penales',
  metric: 'highest',
}

const SECONDS_PER_MINUTE = 60

export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export const MINESWEEPER_GAME: GameDefinition = {
  key: 'minesweeper',
  name: 'Buscaminas',
  description: 'Destapá todo sin pisar una mina',
  path: '/games/buscaminas',
  metric: 'lowest',
  formatValue: formatSeconds,
}

export const GAMES: GameDefinition[] = [
  SNAKE_GAME,
  SPRING_BALL_GAME,
  SMALL_BEE_GAME,
  FLAPPY_GAME,
  TETRIS_GAME,
  PENALTIES_GAME,
  MINESWEEPER_GAME,
]

export function formatGameValue(game: GameDefinition, value: number): string {
  return game.formatValue ? game.formatValue(value) : String(value)
}
