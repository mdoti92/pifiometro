import { describe, expect, it } from 'vitest'
import * as breakout from './breakout/breakout'
import * as dino from './dino/dino'
import * as flappy from './flappy/flappy'
import * as penalties from './penalties/penalties'
import * as pong from './pong/pong'
import * as smallBee from './smallBee/smallBee'
import * as springBall from './springBall/springBall'

const SIXTY_HZ_MS = 1000 / 60

describe('juegos con física', () => {
  it.each([
    ['Breakout', breakout.TICK_MS],
    ['Dino', dino.TICK_MS],
    ['Flappy Bird', flappy.TICK_MS],
    ['Penales', penalties.TICK_MS],
    ['Pong', pong.TICK_MS],
    ['Small Bee', smallBee.TICK_MS],
    ['Spring Ball', springBall.TICK_MS],
  ])('%s avanza a 60 pasos por segundo', (_name, tickMs) => {
    expect(tickMs).toBeCloseTo(SIXTY_HZ_MS)
  })
})
