import type { PixelRect } from '../shared/PixelCanvas'
import {
  BUBBLE_HEIGHT,
  BUBBLE_WIDTH,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  TILE_SIZE,
  cameraFor,
  type DeepAbyssState,
} from './deepAbyss'

const COLORS = {
  waterTop: '#0d4a86',
  waterBottom: '#08305e',
  rock: '#4b3a2e',
  rockEdge: '#6b5442',
  rockSpeck: '#36291f',
  sand: '#c9a45c',
  sandEdge: '#e8c77e',
  spike: '#d0d8e0',
  lava: '#ff5a1f',
  lavaGlow: '#ffb21f',
  gem: '#3df0ff',
  gemShine: '#e8ffff',
  chest: '#9b6a2a',
  chestLid: '#c48a3a',
  chestLock: '#ffd84d',
  exit: '#020c1c',
  exitFrame: '#8fd3ff',
  bubble: '#bfefff',
  bubbleShine: '#ffffff',
  helmet: '#c8d8e8',
  visor: '#1c2c44',
  suit: '#ff9f1a',
  boots: '#a05a10',
}

function isSolidChar(char: string | undefined): boolean {
  return char === '#' || char === '='
}

function tileRects(char: string, x: number, y: number, tileAbove: string | undefined): PixelRect[] {
  switch (char) {
    case '#': {
      const rects: PixelRect[] = [{ x, y, w: TILE_SIZE, h: TILE_SIZE, color: COLORS.rock }]
      if (!isSolidChar(tileAbove)) rects.push({ x, y, w: TILE_SIZE, h: 1, color: COLORS.rockEdge })
      rects.push({ x: x + 2, y: y + 4, w: 1, h: 1, color: COLORS.rockSpeck }, { x: x + 5, y: y + 2, w: 1, h: 1, color: COLORS.rockSpeck })
      return rects
    }
    case '=':
      return [
        { x, y, w: TILE_SIZE, h: TILE_SIZE, color: COLORS.sand },
        { x, y, w: TILE_SIZE, h: 2, color: COLORS.sandEdge },
      ]
    case '^':
      return [
        { x: x + 1, y: y + 7, w: 6, h: 1, color: COLORS.spike },
        { x: x + 1, y: y + 5, w: 2, h: 2, color: COLORS.spike },
        { x: x + 5, y: y + 5, w: 2, h: 2, color: COLORS.spike },
        { x: x + 1, y: y + 3, w: 1, h: 2, color: COLORS.spike },
        { x: x + 6, y: y + 3, w: 1, h: 2, color: COLORS.spike },
      ]
    case '~':
      return [
        { x, y, w: TILE_SIZE, h: TILE_SIZE, color: COLORS.lava },
        { x, y, w: TILE_SIZE, h: 2, color: COLORS.lavaGlow },
      ]
    case 'g':
      return [
        { x: x + 3, y: y + 1, w: 2, h: 1, color: COLORS.gem },
        { x: x + 2, y: y + 2, w: 4, h: 2, color: COLORS.gem },
        { x: x + 3, y: y + 4, w: 2, h: 1, color: COLORS.gem },
        { x: x + 3, y: y + 2, w: 1, h: 1, color: COLORS.gemShine },
      ]
    case 'c':
      return [
        { x: x + 1, y: y + 3, w: 6, h: 5, color: COLORS.chest },
        { x: x + 1, y: y + 2, w: 6, h: 2, color: COLORS.chestLid },
        { x: x + 3, y: y + 4, w: 2, h: 2, color: COLORS.chestLock },
      ]
    case 'E':
      return [
        { x, y, w: TILE_SIZE, h: TILE_SIZE, color: COLORS.exitFrame },
        { x: x + 1, y: y + 1, w: TILE_SIZE - 2, h: TILE_SIZE - 1, color: COLORS.exit },
      ]
    default:
      return []
  }
}

function bubbleRects(x: number, y: number): PixelRect[] {
  const right = x + BUBBLE_WIDTH - 1
  const bottom = y + BUBBLE_HEIGHT - 1
  return [
    { x: x + 2, y, w: BUBBLE_WIDTH - 4, h: 1, color: COLORS.bubble },
    { x: x + 2, y: bottom, w: BUBBLE_WIDTH - 4, h: 1, color: COLORS.bubble },
    { x: x + 1, y: y + 1, w: 1, h: 1, color: COLORS.bubble },
    { x: right - 1, y: y + 1, w: 1, h: 1, color: COLORS.bubble },
    { x: x + 1, y: bottom - 1, w: 1, h: 1, color: COLORS.bubble },
    { x: right - 1, y: bottom - 1, w: 1, h: 1, color: COLORS.bubble },
    { x, y: y + 2, w: 1, h: BUBBLE_HEIGHT - 4, color: COLORS.bubble },
    { x: right, y: y + 2, w: 1, h: BUBBLE_HEIGHT - 4, color: COLORS.bubble },
    { x: x + 3, y: y + 1, w: 2, h: 1, color: COLORS.bubbleShine },
  ]
}

function diverRects(x: number, y: number): PixelRect[] {
  return [
    { x: x + 1, y, w: 4, h: 3, color: COLORS.helmet },
    { x: x + 2, y: y + 1, w: 2, h: 1, color: COLORS.visor },
    { x, y: y + 3, w: 6, h: 3, color: COLORS.suit },
    { x: x + 1, y: y + 6, w: 1, h: 1, color: COLORS.boots },
    { x: x + 4, y: y + 6, w: 1, h: 1, color: COLORS.boots },
  ]
}

export function renderDeepAbyss(state: DeepAbyssState): PixelRect[] {
  const level = state.levels[state.levelIndex]
  const camera = cameraFor(state.player, level)
  const offsetX = Math.round(camera.x)
  const offsetY = Math.round(camera.y)
  const collected = new Set(state.collected)

  const rects: PixelRect[] = [
    { x: 0, y: 0, w: SCREEN_WIDTH, h: SCREEN_HEIGHT / 2, color: COLORS.waterTop },
    { x: 0, y: SCREEN_HEIGHT / 2, w: SCREEN_WIDTH, h: SCREEN_HEIGHT / 2, color: COLORS.waterBottom },
  ]

  const firstColumn = Math.floor(offsetX / TILE_SIZE)
  const firstRow = Math.floor(offsetY / TILE_SIZE)
  for (let row = firstRow; row <= firstRow + SCREEN_HEIGHT / TILE_SIZE; row++) {
    for (let column = firstColumn; column <= firstColumn + SCREEN_WIDTH / TILE_SIZE; column++) {
      const char = level.tiles[row]?.[column]
      if (!char || collected.has(`${column},${row}`)) continue
      rects.push(...tileRects(char, column * TILE_SIZE - offsetX, row * TILE_SIZE - offsetY, level.tiles[row - 1]?.[column]))
    }
  }

  for (const bubble of state.bubbles) rects.push(...bubbleRects(bubble.x - offsetX, bubble.y - offsetY))
  rects.push(...diverRects(state.player.x - offsetX, state.player.y - offsetY))
  return rects
}
