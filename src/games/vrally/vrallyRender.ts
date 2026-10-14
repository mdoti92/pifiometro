import type { PixelRect } from '../shared/PixelCanvas'
import { MAX_SPEED, RIVALS, SEGMENT_LENGTH, TRACK, segmentAt, type VRallyState } from './vrally'

// Pantalla del T290 en píxeles lógicos.
export const SCREEN_WIDTH = 160
export const SCREEN_HEIGHT = 128

const HORIZON_Y = 52
const FOCAL_LENGTH_PX = 80
const CAMERA_HEIGHT = 1000
const ROAD_WORLD_HALF_WIDTH = 1000
const RUMBLE_RATIO = 1.15
const LANE_RATIO = 0.04
const MAX_DRAW_DEPTH = 32000
/** Cuánto se tuerce la ruta por unidad de curva y de distancia (al cuadrado). */
const CURVE_BEND = 3e-5
const STRIPE_LENGTH = SEGMENT_LENGTH * 2
const MOUNTAIN_PARALLAX_PX = 60
const MOUNTAIN_COLUMN_WIDTH = 2
const TREE_WORLD_WIDTH = 420
const TREE_WORLD_HEIGHT = 1100
const CAR_Y = SCREEN_HEIGHT - 16
const CAR_SPRITE_WIDTH = 24
const CAR_SPRITE_HEIGHT = 13
const CAR_WORLD_WIDTH = 650
const SIGN_INTERVAL_SEGMENTS = 55
const SIGN_OFFSETS = [1.9, -1.9]
const SIGN_WORLD_WIDTH = 600
const SIGN_WORLD_HEIGHT = 900
const CLOUD_PARALLAX_PX = 25
const CLOUD_ANCHORS = [12, 70, 128]
const DUST_MIN_SPEED_RATIO = 0.15
const DUST_FLICKER_MS = 120
const ROAD_HALF = 1

export const CLOUD_COLOR = '#f4f8ff'
export const DUST_COLOR = '#c9b48a'
export const SIGN_COLOR = '#f0e6c0'

const COLORS = {
  skyHigh: '#3f86d6',
  skyLow: '#9fd0ff',
  mountain: '#5a5f96',
  mountainSnow: '#dfe6f5',
  grassLight: '#43a843',
  grassDark: '#36923a',
  rumbleLight: '#f0f0f0',
  rumbleDark: '#c8302c',
  roadLight: '#767676',
  roadDark: '#6c6c6c',
  lane: '#f4f4f4',
  trunk: '#6b4422',
  leaves: '#1f6b2a',
  carBody: '#d8261f',
  carShade: '#8e1712',
  carGlass: '#1c2c44',
  wheel: '#141414',
  light: '#ffd84d',
  signPost: '#5a4632',
  signStripe: '#1d4fa8',
  rivalShade: 'rgba(0, 0, 0, 0.35)',
}

interface Row {
  y: number
  depth: number
  scale: number
  centerX: number
}

function sky(): PixelRect[] {
  const half = HORIZON_Y / 2
  return [
    { x: 0, y: 0, w: SCREEN_WIDTH, h: half, color: COLORS.skyHigh },
    { x: 0, y: half, w: SCREEN_WIDTH, h: HORIZON_Y - half, color: COLORS.skyLow },
  ]
}

function clouds(backgroundOffset: number): PixelRect[] {
  const shift = backgroundOffset * CLOUD_PARALLAX_PX
  return CLOUD_ANCHORS.flatMap((anchor, index) => {
    const x = ((((anchor - shift) % SCREEN_WIDTH) + SCREEN_WIDTH) % SCREEN_WIDTH) - 10
    const y = 8 + (index % 2) * 9
    return [
      { x: x + 3, y, w: 10, h: 2, color: CLOUD_COLOR },
      { x, y: y + 2, w: 18, h: 3, color: CLOUD_COLOR },
    ]
  })
}

function mountains(backgroundOffset: number): PixelRect[] {
  const rects: PixelRect[] = []
  const shift = backgroundOffset * MOUNTAIN_PARALLAX_PX
  for (let x = 0; x < SCREEN_WIDTH; x += MOUNTAIN_COLUMN_WIDTH) {
    const u = x + shift
    const height = Math.round(12 + Math.sin(u * 0.045) * 7 + Math.sin(u * 0.13) * 3)
    rects.push({ x, y: HORIZON_Y - height, w: MOUNTAIN_COLUMN_WIDTH, h: height, color: COLORS.mountain })
    if (height > 17) rects.push({ x, y: HORIZON_Y - height, w: MOUNTAIN_COLUMN_WIDTH, h: 2, color: COLORS.mountainSnow })
  }
  return rects
}

/** Proyección por scanlines: cada fila de pantalla bajo el horizonte es una distancia de ruta. */
function projectRows(state: VRallyState): Row[] {
  const rows: Row[] = []
  let x = 0
  let dx = 0
  let previousDepth = 0
  for (let y = SCREEN_HEIGHT - 1; y > HORIZON_Y; y--) {
    const depth = (CAMERA_HEIGHT * FOCAL_LENGTH_PX) / (y - HORIZON_Y)
    const step = depth - previousDepth
    previousDepth = depth
    dx += segmentAt(state.position + depth).curve * CURVE_BEND * step
    x += dx * step
    const scale = FOCAL_LENGTH_PX / depth
    const centerX = SCREEN_WIDTH / 2 + (x - state.playerX * ROAD_WORLD_HALF_WIDTH) * scale
    rows.push({ y, depth, scale, centerX })
  }
  return rows
}

function road(state: VRallyState, rows: Row[]): PixelRect[] {
  const rects: PixelRect[] = []
  for (const row of rows) {
    const light = Math.floor((state.position + row.depth) / STRIPE_LENGTH) % 2 === 0
    rects.push({ x: 0, y: row.y, w: SCREEN_WIDTH, h: 1, color: light ? COLORS.grassLight : COLORS.grassDark })
    if (row.depth > MAX_DRAW_DEPTH) continue

    const halfWidth = ROAD_WORLD_HALF_WIDTH * row.scale
    const rumble = halfWidth * RUMBLE_RATIO
    rects.push({ x: row.centerX - rumble, y: row.y, w: rumble * 2, h: 1, color: light ? COLORS.rumbleLight : COLORS.rumbleDark })
    rects.push({ x: row.centerX - halfWidth, y: row.y, w: halfWidth * 2, h: 1, color: light ? COLORS.roadLight : COLORS.roadDark })
    if (light) {
      const lane = Math.max(halfWidth * LANE_RATIO, 0.5)
      rects.push({ x: row.centerX - lane, y: row.y, w: lane * 2, h: 1, color: COLORS.lane })
    }
  }
  return rects
}

interface Sprite {
  depth: number
  offset: number
  draw: (row: Row, centerX: number) => PixelRect[]
}

function treeSprite(row: Row, centerX: number): PixelRect[] {
  const width = Math.max(TREE_WORLD_WIDTH * row.scale, 1)
  const height = Math.max(TREE_WORLD_HEIGHT * row.scale, 2)
  const x = centerX - width / 2
  const base = row.y
  return [
    { x: x + width * 0.4, y: base - height * 0.3, w: Math.max(width * 0.2, 1), h: height * 0.3, color: COLORS.trunk },
    { x, y: base - height * 0.65, w: width, h: height * 0.35, color: COLORS.leaves },
    { x: x + width * 0.2, y: base - height, w: width * 0.6, h: height * 0.35, color: COLORS.leaves },
  ]
}

function signSprite(row: Row, centerX: number): PixelRect[] {
  const width = Math.max(SIGN_WORLD_WIDTH * row.scale, 2)
  const height = Math.max(SIGN_WORLD_HEIGHT * row.scale, 2)
  const postWidth = Math.max(width * 0.1, 1)
  return [
    { x: centerX - postWidth / 2, y: row.y - height, w: postWidth, h: height, color: COLORS.signPost },
    { x: centerX - width / 2, y: row.y - height, w: width, h: height * 0.45, color: SIGN_COLOR },
    { x: centerX - width / 2, y: row.y - height * 0.82, w: width, h: Math.max(height * 0.08, 0.5), color: COLORS.signStripe },
  ]
}

/** Auto visto de espaldas: sprite de 24x13 escalado según la distancia. */
function carRects(left: number, top: number, scale: number, body: string, roof: string): PixelRect[] {
  const at = (x: number, y: number, w: number, h: number, color: string): PixelRect => ({
    x: left + x * scale,
    y: top + y * scale,
    w: w * scale,
    h: h * scale,
    color,
  })
  return [
    at(0, 8, 5, 5, COLORS.wheel),
    at(19, 8, 5, 5, COLORS.wheel),
    at(1, 4, 22, 7, body),
    at(5, 0, 14, 5, roof),
    at(6, 1, 12, 3, COLORS.carGlass),
    at(2, 6, 3, 2, COLORS.light),
    at(19, 6, 3, 2, COLORS.light),
  ]
}

function rivalSprite(color: string) {
  return (row: Row, centerX: number): PixelRect[] => {
    const scale = (CAR_WORLD_WIDTH * row.scale) / CAR_SPRITE_WIDTH
    const left = centerX - (CAR_SPRITE_WIDTH * scale) / 2
    const top = row.y - CAR_SPRITE_HEIGHT * scale
    const rects = carRects(left, top, scale, color, color)
    // Techo más oscuro que la carrocería, sobre el color del rival.
    return [...rects.slice(0, 4), { ...rects[3], color: COLORS.rivalShade }, ...rects.slice(4)]
  }
}

const SIGNS = TRACK.segments
  .filter((segment) => segment.index > 0 && segment.index % SIGN_INTERVAL_SEGMENTS === 0)
  .map((segment, index) => ({ segment: segment.index, offset: SIGN_OFFSETS[index % SIGN_OFFSETS.length] }))

/** Árboles, carteles y rivales proyectados en la ruta, dibujados del más lejano al más cercano. */
function sprites(state: VRallyState, rows: Row[]): PixelRect[] {
  const all: Sprite[] = [
    ...TRACK.trees.map((tree) => ({ depth: tree.segment * SEGMENT_LENGTH - state.position, offset: tree.offset, draw: treeSprite })),
    ...SIGNS.map((sign) => ({ depth: sign.segment * SEGMENT_LENGTH - state.position, offset: sign.offset, draw: signSprite })),
    ...state.rivals.map((rival, index) => ({
      depth: rival.position - state.position,
      offset: RIVALS[index].lane,
      draw: rivalSprite(RIVALS[index].color),
    })),
  ]

  return all
    .filter(({ depth }) => depth > 0 && depth < MAX_DRAW_DEPTH)
    .sort((a, b) => b.depth - a.depth)
    .flatMap(({ depth, offset, draw }) => {
      const row = rows.reduce((best, candidate) =>
        Math.abs(candidate.depth - depth) < Math.abs(best.depth - depth) ? candidate : best,
      )
      return draw(row, row.centerX + offset * ROAD_WORLD_HALF_WIDTH * row.scale)
    })
}

function dust(state: VRallyState): PixelRect[] {
  const offroad = Math.abs(state.playerX) > ROAD_HALF
  if (!offroad || state.speed < MAX_SPEED * DUST_MIN_SPEED_RATIO) return []
  const flicker = Math.floor(state.elapsedMs / DUST_FLICKER_MS) % 2
  const left = SCREEN_WIDTH / 2 - CAR_SPRITE_WIDTH / 2
  return [
    { x: left - 3 - flicker, y: CAR_Y + 10, w: 3, h: 2, color: DUST_COLOR },
    { x: left - 6, y: CAR_Y + 8 + flicker, w: 2, h: 2, color: DUST_COLOR },
    { x: left + CAR_SPRITE_WIDTH + flicker, y: CAR_Y + 10, w: 3, h: 2, color: DUST_COLOR },
    { x: left + CAR_SPRITE_WIDTH + 4, y: CAR_Y + 8 + flicker, w: 2, h: 2, color: DUST_COLOR },
  ]
}

function car(): PixelRect[] {
  return carRects(SCREEN_WIDTH / 2 - CAR_SPRITE_WIDTH / 2, CAR_Y, 1, COLORS.carBody, COLORS.carShade)
}

export function renderVRally(state: VRallyState): PixelRect[] {
  const rows = projectRows(state)
  return [
    ...sky(),
    ...clouds(state.backgroundOffset),
    ...mountains(state.backgroundOffset),
    ...road(state, rows),
    ...sprites(state, rows),
    ...dust(state),
    ...car(),
  ]
}
