import type { Horizontal } from '../shared/input'
import type { RandomSource } from '../shared/useGameLoop'

// Unidades del mundo: la ruta mide 2 de ancho en "medios anchos" (playerX en [-1, 1] es asfalto).
export const SEGMENT_LENGTH = 200
export const STEP_MS = 1000 / 60
export const MAX_SPEED = 12000
export const ACCELERATION = MAX_SPEED / 4
export const OFFROAD_MAX_SPEED = MAX_SPEED / 4
export const OFFROAD_DECELERATION = MAX_SPEED
export const CRASH_SPEED = MAX_SPEED / 40
/** Desplazamiento lateral por segundo (en medios anchos de ruta) a velocidad máxima. */
export const STEER_RATE = 2.2
/** Empuje hacia afuera por unidad de curva y por segundo, a velocidad máxima. */
export const CENTRIFUGAL = 0.35
export const MAX_PLAYER_X = 2.6
export const TREE_HIT_HALF_WIDTH = 0.35

const ROAD_HALF_WIDTH = 1
const TREE_INTERVAL_SEGMENTS = 9
const TREE_OFFSETS = [1.7, -2.3, 2.4, -1.6]
const MS_PER_TENTH = 100

export interface Segment {
  index: number
  curve: number
}

export interface Tree {
  segment: number
  offset: number
}

interface Section {
  length: number
  curve: number
}

// El tramo es siempre el mismo: rectas y curvas a izquierda (negativas) y derecha (positivas).
const SECTIONS: Section[] = [
  { length: 120, curve: 0 },
  { length: 110, curve: 2 },
  { length: 70, curve: 0 },
  { length: 140, curve: -3 },
  { length: 60, curve: 0 },
  { length: 180, curve: 1 },
  { length: 120, curve: -1 },
  { length: 140, curve: 0 },
  { length: 100, curve: 3 },
  { length: 80, curve: 0 },
  { length: 170, curve: -2 },
  { length: 120, curve: 2 },
  { length: 110, curve: 0 },
  { length: 90, curve: -4 },
  { length: 60, curve: 0 },
  { length: 90, curve: 4 },
  { length: 100, curve: 0 },
  { length: 190, curve: -1 },
  { length: 80, curve: 0 },
  { length: 150, curve: 2 },
  { length: 150, curve: -2 },
  { length: 160, curve: 0 },
]

function buildTrack(): { segments: Segment[]; trees: Tree[] } {
  const segments: Segment[] = []
  for (const section of SECTIONS) {
    for (let i = 0; i < section.length; i++) segments.push({ index: segments.length, curve: section.curve })
  }

  const trees: Tree[] = []
  for (let segment = TREE_INTERVAL_SEGMENTS; segment < segments.length; segment += TREE_INTERVAL_SEGMENTS) {
    trees.push({ segment, offset: TREE_OFFSETS[(segment / TREE_INTERVAL_SEGMENTS) % TREE_OFFSETS.length] })
  }
  return { segments, trees }
}

export const TRACK = buildTrack()

export function trackLength(): number {
  return TRACK.segments.length * SEGMENT_LENGTH
}

export function segmentAt(position: number): Segment {
  const index = Math.floor(position / SEGMENT_LENGTH)
  return TRACK.segments[Math.min(Math.max(index, 0), TRACK.segments.length - 1)]
}

export interface VRallyState {
  position: number
  speed: number
  playerX: number
  elapsedMs: number
  /** Desplazamiento acumulado del fondo por las curvas (parallax de las montañas). */
  backgroundOffset: number
  isOver: boolean
}

export function createVRally(_random: RandomSource): VRallyState {
  return { position: 0, speed: 0, playerX: 0, elapsedMs: 0, backgroundOffset: 0, isOver: false }
}

const treesBySegment = new Map<number, Tree[]>()
for (const tree of TRACK.trees) treesBySegment.set(tree.segment, [...(treesBySegment.get(tree.segment) ?? []), tree])

function hitsTree(segmentIndex: number, playerX: number): boolean {
  return (treesBySegment.get(segmentIndex) ?? []).some((tree) => Math.abs(tree.offset - playerX) < TREE_HIT_HALF_WIDTH)
}

export function stepVRally(state: VRallyState, input: Horizontal, _random: RandomSource): VRallyState {
  if (state.isOver) return state

  const dt = STEP_MS / 1000
  const segment = segmentAt(state.position)
  const speedRatio = state.speed / MAX_SPEED
  const offroad = Math.abs(state.playerX) > ROAD_HALF_WIDTH

  let speed = Math.min(state.speed + ACCELERATION * dt, MAX_SPEED)
  if (offroad && speed > OFFROAD_MAX_SPEED) speed = Math.max(state.speed - OFFROAD_DECELERATION * dt, OFFROAD_MAX_SPEED)

  let playerX = state.playerX + input * STEER_RATE * speedRatio * dt
  playerX -= segment.curve * CENTRIFUGAL * speedRatio * speedRatio * dt
  playerX = Math.min(Math.max(playerX, -MAX_PLAYER_X), MAX_PLAYER_X)

  const position = state.position + speed * dt
  if (hitsTree(segmentAt(position).index, playerX)) speed = Math.min(speed, CRASH_SPEED)

  return {
    position,
    speed,
    playerX,
    elapsedMs: state.elapsedMs + STEP_MS,
    backgroundOffset: state.backgroundOffset + segment.curve * speedRatio * dt,
    isOver: position >= trackLength(),
  }
}

export function timeInTenths(elapsedMs: number): number {
  return Math.floor(elapsedMs / MS_PER_TENTH)
}
