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

export const GAMES: GameDefinition[] = [SNAKE_GAME, SPRING_BALL_GAME]

export function formatGameValue(game: GameDefinition, value: number): string {
  return game.formatValue ? game.formatValue(value) : String(value)
}
