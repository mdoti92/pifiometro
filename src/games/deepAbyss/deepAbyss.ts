import type { RandomSource } from '../shared/useGameLoop'

export const TILE_SIZE = 8
export const SCREEN_WIDTH = 160
export const SCREEN_HEIGHT = 128
export const PLAYER_WIDTH = 6
export const PLAYER_HEIGHT = 7
export const WALK_SPEED = 1.2
export const GRAVITY = 0.18
export const JUMP_VELOCITY = -3.4
export const MAX_FALL_SPEED = 3
export const BUBBLE_WIDTH = 10
export const BUBBLE_HEIGHT = 6
export const BUBBLE_SPEED = 0.6
export const GEM_POINTS = 10
export const CHEST_POINTS = 50
export const LEVEL_COMPLETE_BONUS = 200
export const INITIAL_LIVES = 3
export const STEP_MS = 1000 / 60

// Inset de la zona que lastima de los pinchos: la punta ocupa la parte baja del tile.
const SPIKE_INSET_X = 1
const SPIKE_INSET_TOP = 3

export type TileChar = '#' | '=' | '^' | '~' | 'g' | 'c' | 'S' | 'E' | '.'

export interface LevelDefinition {
  /** Filas del tilemap: # roca, = arena, ^ pinchos, ~ lava, g gema, c cofre, S inicio, E salida, . agua. */
  map: string[]
  /** Burbujas: tile donde arrancan y tile hasta donde llevan (la superficie queda al pie del tile). */
  bubbles: { from: [number, number]; to: [number, number] }[]
}

interface Point {
  x: number
  y: number
}

export interface ParsedLevel {
  tiles: string[][]
  width: number
  height: number
  start: Point
  exit: Point
  bubbles: { from: Point; to: Point }[]
}

export interface Player {
  x: number
  y: number
  vx: number
  vy: number
  grounded: boolean
  /** Índice de la burbuja sobre la que va montado, o null. */
  riding: number | null
}

export type AbyssPhase = 'playing' | 'complete' | 'over'

export interface DeepAbyssState {
  levels: ParsedLevel[]
  levelIndex: number
  player: Player
  bubbles: Point[]
  collected: string[]
  gems: number
  chests: number
  score: number
  lives: number
  phase: AbyssPhase
  isOver: boolean
}

export interface AbyssInput {
  move: -1 | 0 | 1
  jump: boolean
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

function bubbleAt([tileX, tileY]: [number, number]): Point {
  return { x: tileX * TILE_SIZE - (BUBBLE_WIDTH - TILE_SIZE) / 2, y: (tileY + 1) * TILE_SIZE }
}

function findTile(tiles: string[][], char: string): Point {
  for (let y = 0; y < tiles.length; y++) {
    const x = tiles[y].indexOf(char)
    if (x >= 0) return { x: x * TILE_SIZE, y: y * TILE_SIZE }
  }
  throw new Error(`El nivel no tiene ${char}`)
}

export function parseLevel(definition: LevelDefinition): ParsedLevel {
  const tiles = definition.map.map((row) => [...row])
  return {
    tiles,
    width: tiles[0].length * TILE_SIZE,
    height: tiles.length * TILE_SIZE,
    start: findTile(tiles, 'S'),
    exit: findTile(tiles, 'E'),
    bubbles: definition.bubbles.map((bubble) => ({ from: bubbleAt(bubble.from), to: bubbleAt(bubble.to) })),
  }
}

function spawnPlayer(level: ParsedLevel): Player {
  return {
    x: level.start.x + (TILE_SIZE - PLAYER_WIDTH) / 2,
    y: level.start.y + TILE_SIZE - PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    grounded: false,
    riding: null,
  }
}

function startLevel(levels: ParsedLevel[], levelIndex: number) {
  const level = levels[levelIndex]
  return { levelIndex, player: spawnPlayer(level), bubbles: level.bubbles.map((bubble) => ({ ...bubble.from })), collected: [] }
}

export function createDeepAbyss(_random: RandomSource, definitions: LevelDefinition[] = []): DeepAbyssState {
  const levels = definitions.map(parseLevel)
  return {
    levels,
    ...startLevel(levels, 0),
    gems: 0,
    chests: 0,
    score: 0,
    lives: INITIAL_LIVES,
    phase: 'playing',
    isOver: false,
  }
}

function tileAt(level: ParsedLevel, x: number, y: number): string {
  const column = Math.floor(x / TILE_SIZE)
  const row = Math.floor(y / TILE_SIZE)
  return level.tiles[row]?.[column] ?? '#'
}

function isSolid(char: string): boolean {
  return char === '#' || char === '='
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/** Tiles que toca una caja, con su posición. */
function touchedTiles(level: ParsedLevel, box: Box): { char: string; column: number; row: number }[] {
  const result = []
  for (let row = Math.floor(box.y / TILE_SIZE); row <= Math.floor((box.y + box.h - 0.001) / TILE_SIZE); row++) {
    for (let column = Math.floor(box.x / TILE_SIZE); column <= Math.floor((box.x + box.w - 0.001) / TILE_SIZE); column++) {
      result.push({ char: level.tiles[row]?.[column] ?? '#', column, row })
    }
  }
  return result
}

function collidesWithSolid(level: ParsedLevel, box: Box): boolean {
  return touchedTiles(level, box).some(({ char }) => isSolid(char))
}

function playerBox(player: Pick<Player, 'x' | 'y'>): Box {
  return { x: player.x, y: player.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT }
}

function moveTowards(current: Point, target: Point): Point {
  const dx = target.x - current.x
  const dy = target.y - current.y
  const distance = Math.hypot(dx, dy)
  if (distance <= BUBBLE_SPEED) return { ...target }
  return { x: current.x + (dx / distance) * BUBBLE_SPEED, y: current.y + (dy / distance) * BUBBLE_SPEED }
}

function hazardTouched(level: ParsedLevel, box: Box): boolean {
  return touchedTiles(level, box).some(({ char, column, row }) => {
    if (char === '~') return true
    if (char !== '^') return false
    const spike = {
      x: column * TILE_SIZE + SPIKE_INSET_X,
      y: row * TILE_SIZE + SPIKE_INSET_TOP,
      w: TILE_SIZE - SPIKE_INSET_X * 2,
      h: TILE_SIZE - SPIKE_INSET_TOP,
    }
    return overlaps(box, spike)
  })
}

function stepBubbles(state: DeepAbyssState, level: ParsedLevel): Point[] {
  return state.bubbles.map((bubble, index) => {
    const path = level.bubbles[index]
    // Montado va hacia el otro lado; libre vuelve a su punto de partida.
    return moveTowards(bubble, state.player.riding === index ? path.to : path.from)
  })
}

function movePlayer(state: DeepAbyssState, level: ParsedLevel, bubbles: Point[], input: AbyssInput): Player {
  const previous = state.player
  let { x, y, vy, riding } = previous

  if (riding !== null) {
    x += bubbles[riding].x - state.bubbles[riding].x
    y = bubbles[riding].y - PLAYER_HEIGHT
  }

  const canJump = previous.grounded || riding !== null
  if (input.jump && canJump) {
    vy = JUMP_VELOCITY
    riding = null
  }

  const vx = input.move * WALK_SPEED
  if (!collidesWithSolid(level, { x: x + vx, y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT })) x += vx

  if (riding !== null) {
    const bubble = bubbles[riding]
    const stillOnBubble = x + PLAYER_WIDTH > bubble.x && x < bubble.x + BUBBLE_WIDTH
    if (stillOnBubble) return { x, y: bubble.y - PLAYER_HEIGHT, vx, vy: 0, grounded: true, riding }
    riding = null
  }

  vy = Math.min(vy + GRAVITY, MAX_FALL_SPEED)
  const previousBottom = y + PLAYER_HEIGHT
  let nextY = y + vy
  let grounded = false

  if (collidesWithSolid(level, { x, y: nextY, w: PLAYER_WIDTH, h: PLAYER_HEIGHT })) {
    if (vy > 0) {
      nextY = Math.floor((nextY + PLAYER_HEIGHT) / TILE_SIZE) * TILE_SIZE - PLAYER_HEIGHT
      grounded = true
    } else {
      nextY = Math.ceil(nextY / TILE_SIZE) * TILE_SIZE
    }
    vy = 0
  }

  if (vy >= 0) {
    const landing = bubbles.findIndex(
      (bubble) =>
        x + PLAYER_WIDTH > bubble.x &&
        x < bubble.x + BUBBLE_WIDTH &&
        previousBottom <= bubble.y &&
        nextY + PLAYER_HEIGHT >= bubble.y,
    )
    if (landing >= 0) return { x, y: bubbles[landing].y - PLAYER_HEIGHT, vx, vy: 0, grounded: true, riding: landing }
  }

  return { x, y: nextY, vx, vy, grounded, riding: null }
}

function collect(state: DeepAbyssState, level: ParsedLevel, player: Player) {
  let { collected, gems, chests, score } = state
  for (const { char, column, row } of touchedTiles(level, playerBox(player))) {
    const key = `${column},${row}`
    if ((char !== 'g' && char !== 'c') || collected.includes(key)) continue
    collected = [...collected, key]
    if (char === 'g') {
      gems += 1
      score += GEM_POINTS
    } else {
      chests += 1
      score += CHEST_POINTS
    }
  }
  return { collected, gems, chests, score }
}

export function stepDeepAbyss(state: DeepAbyssState, input: AbyssInput, _random: RandomSource): DeepAbyssState {
  if (state.phase !== 'playing') return state

  const level = state.levels[state.levelIndex]
  const bubbles = stepBubbles(state, level)
  const player = movePlayer(state, level, bubbles, input)
  const box = playerBox(player)

  if (hazardTouched(level, box)) {
    const lives = state.lives - 1
    if (lives <= 0) return { ...state, lives: 0, phase: 'over', isOver: true }
    return { ...state, lives, player: spawnPlayer(level), bubbles: level.bubbles.map((bubble) => ({ ...bubble.from })) }
  }

  const gathered = collect(state, level, player)
  const exit = { x: level.exit.x, y: level.exit.y, w: TILE_SIZE, h: TILE_SIZE }
  if (overlaps(box, exit)) {
    return { ...state, ...gathered, player, bubbles, score: gathered.score + LEVEL_COMPLETE_BONUS, phase: 'complete', isOver: true }
  }

  return { ...state, ...gathered, player, bubbles }
}

export function cameraFor(target: Point, level: { width: number; height: number }): Point {
  const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(max, 0))
  return {
    x: clamp(target.x + PLAYER_WIDTH / 2 - SCREEN_WIDTH / 2, level.width - SCREEN_WIDTH),
    y: clamp(target.y + PLAYER_HEIGHT / 2 - SCREEN_HEIGHT / 2, level.height - SCREEN_HEIGHT),
  }
}

export { tileAt }
