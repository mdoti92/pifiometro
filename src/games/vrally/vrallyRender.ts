import type { PixelRect } from '../shared/PixelCanvas'
import { SEGMENT_LENGTH, TRACK, segmentAt, type VRallyState } from './vrally'

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

function trees(state: VRallyState, rows: Row[]): PixelRect[] {
  const rects: PixelRect[] = []
  const visible = TRACK.trees
    .map((tree) => ({ tree, depth: tree.segment * SEGMENT_LENGTH - state.position }))
    .filter(({ depth }) => depth > 0 && depth < MAX_DRAW_DEPTH)
    .sort((a, b) => b.depth - a.depth)

  for (const { tree, depth } of visible) {
    const row = rows.reduce((best, candidate) =>
      Math.abs(candidate.depth - depth) < Math.abs(best.depth - depth) ? candidate : best,
    )
    const width = Math.max(TREE_WORLD_WIDTH * row.scale, 1)
    const height = Math.max(TREE_WORLD_HEIGHT * row.scale, 2)
    const x = row.centerX + tree.offset * ROAD_WORLD_HALF_WIDTH * row.scale - width / 2
    const base = row.y
    rects.push({ x: x + width * 0.4, y: base - height * 0.3, w: Math.max(width * 0.2, 1), h: height * 0.3, color: COLORS.trunk })
    rects.push({ x, y: base - height * 0.65, w: width, h: height * 0.35, color: COLORS.leaves })
    rects.push({ x: x + width * 0.2, y: base - height, w: width * 0.6, h: height * 0.35, color: COLORS.leaves })
  }
  return rects
}

function car(): PixelRect[] {
  const left = SCREEN_WIDTH / 2 - 12
  return [
    { x: left, y: CAR_Y + 8, w: 5, h: 5, color: COLORS.wheel },
    { x: left + 19, y: CAR_Y + 8, w: 5, h: 5, color: COLORS.wheel },
    { x: left + 1, y: CAR_Y + 4, w: 22, h: 7, color: COLORS.carBody },
    { x: left + 5, y: CAR_Y, w: 14, h: 5, color: COLORS.carShade },
    { x: left + 6, y: CAR_Y + 1, w: 12, h: 3, color: COLORS.carGlass },
    { x: left + 2, y: CAR_Y + 6, w: 3, h: 2, color: COLORS.light },
    { x: left + 19, y: CAR_Y + 6, w: 3, h: 2, color: COLORS.light },
  ]
}

export function renderVRally(state: VRallyState): PixelRect[] {
  const rows = projectRows(state)
  return [...sky(), ...mountains(state.backgroundOffset), ...road(state, rows), ...trees(state, rows), ...car()]
}
