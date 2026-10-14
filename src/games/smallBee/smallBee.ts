import type { Horizontal } from '../shared/input'
import type { PixelRect } from '../shared/PixelCanvas'
import type { RandomSource } from '../shared/useGameLoop'

// Unidades lógicas en coordenadas de pantalla (y crece hacia abajo).
export const VIEW_WIDTH = 48
export const VIEW_HEIGHT = 72
export const BEE_WIDTH = 5
export const BEE_HEIGHT = 3
export const BEE_Y = VIEW_HEIGHT - 6
export const BEE_SPEED = 1
export const BUG_WIDTH = 4
export const BUG_HEIGHT = 3
export const STINGER_WIDTH = 1
export const STINGER_HEIGHT = 2
export const STINGER_SPEED = 2
export const FIRE_INTERVAL_TICKS = 12
export const BUG_POINTS = 1
export const INITIAL_LIVES = 3
export const TICK_MS = 33

export interface Level {
  minScore: number
  fallSpeed: number
  spawnEveryTicks: number
}

export const LEVELS: Level[] = [
  { minScore: 0, fallSpeed: 0.35, spawnEveryTicks: 45 },
  { minScore: 10, fallSpeed: 0.5, spawnEveryTicks: 36 },
  { minScore: 25, fallSpeed: 0.65, spawnEveryTicks: 28 },
  { minScore: 45, fallSpeed: 0.8, spawnEveryTicks: 22 },
  { minScore: 70, fallSpeed: 1, spawnEveryTicks: 16 },
]

export interface Entity {
  x: number
  y: number
}

export interface SmallBeeState {
  beeX: number
  bugs: Entity[]
  stingers: Entity[]
  lives: number
  score: number
  tick: number
  isOver: boolean
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

const bugBox = (bug: Entity): Box => ({ x: bug.x, y: bug.y, w: BUG_WIDTH, h: BUG_HEIGHT })
const stingerBox = (stinger: Entity): Box => ({ x: stinger.x, y: stinger.y, w: STINGER_WIDTH, h: STINGER_HEIGHT })

export function currentLevel(score: number): Level {
  return [...LEVELS].reverse().find((level) => score >= level.minScore) ?? LEVELS[0]
}

export function createSmallBee(_random: RandomSource): SmallBeeState {
  return {
    beeX: (VIEW_WIDTH - BEE_WIDTH) / 2,
    bugs: [],
    stingers: [],
    lives: INITIAL_LIVES,
    score: 0,
    tick: 0,
    isOver: false,
  }
}

export function stepSmallBee(state: SmallBeeState, input: Horizontal, random: RandomSource): SmallBeeState {
  if (state.isOver) return state

  const tick = state.tick + 1
  const level = currentLevel(state.score)
  const beeX = Math.min(Math.max(state.beeX + input * BEE_SPEED, 0), VIEW_WIDTH - BEE_WIDTH)
  const beeBox: Box = { x: beeX, y: BEE_Y, w: BEE_WIDTH, h: BEE_HEIGHT }

  let stingers = state.stingers
    .map((stinger) => ({ ...stinger, y: stinger.y - STINGER_SPEED }))
    .filter((stinger) => stinger.y + STINGER_HEIGHT > 0)
  if (tick % FIRE_INTERVAL_TICKS === 0) {
    stingers = [...stingers, { x: beeX + Math.floor(BEE_WIDTH / 2), y: BEE_Y - STINGER_HEIGHT }]
  }

  let bugs = state.bugs.map((bug) => ({ ...bug, y: bug.y + level.fallSpeed }))
  if (tick % level.spawnEveryTicks === 0) {
    bugs = [...bugs, { x: Math.floor(random() * (VIEW_WIDTH - BUG_WIDTH + 1)), y: -BUG_HEIGHT }]
  }

  let score = state.score
  const survivingBugs: Entity[] = []
  for (const bug of bugs) {
    const hit = stingers.find((stinger) => overlaps(stingerBox(stinger), bugBox(bug)))
    if (hit) {
      stingers = stingers.filter((stinger) => stinger !== hit)
      score += BUG_POINTS
    } else {
      survivingBugs.push(bug)
    }
  }

  let lives = state.lives
  const remainingBugs = survivingBugs.filter((bug) => {
    const escaped = overlaps(bugBox(bug), beeBox) || bug.y + BUG_HEIGHT >= VIEW_HEIGHT
    if (escaped) lives -= 1
    return !escaped
  })

  return {
    beeX,
    bugs: remainingBugs,
    stingers,
    lives,
    score,
    tick,
    isOver: lives <= 0,
  }
}

function beeRects(x: number): PixelRect[] {
  return [
    { x: x + 1, y: BEE_Y + 1, w: BEE_WIDTH - 2, h: BEE_HEIGHT - 1 },
    { x: x + 2, y: BEE_Y, w: 1, h: 1 },
    { x, y: BEE_Y, w: 1, h: 2 },
    { x: x + BEE_WIDTH - 1, y: BEE_Y, w: 1, h: 2 },
  ]
}

function bugRects({ x, y }: Entity): PixelRect[] {
  return [
    { x, y, w: 1, h: 1 },
    { x: x + BUG_WIDTH - 1, y, w: 1, h: 1 },
    { x, y: y + 1, w: BUG_WIDTH, h: 1 },
    { x: x + 1, y: y + 2, w: BUG_WIDTH - 2, h: 1 },
  ]
}

export function toScreenRects(state: SmallBeeState): PixelRect[] {
  return [
    ...beeRects(state.beeX),
    ...state.bugs.flatMap(bugRects),
    ...state.stingers.map((stinger) => ({ ...stinger, w: STINGER_WIDTH, h: STINGER_HEIGHT })),
  ]
}
