import { describe, expect, it } from 'vitest'
import { GAMES } from './catalog'

describe('catálogo de juegos', () => {
  it.each(GAMES.map((game) => [game.name, game] as const))('%s explica el objetivo y cómo se juega', (_name, game) => {
    expect(game.goal.trim().length).toBeGreaterThan(10)
    expect(game.howToPlay.trim().length).toBeGreaterThan(10)
  })
})
