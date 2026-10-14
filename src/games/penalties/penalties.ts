import type { PixelRect } from '../shared/PixelCanvas'
import type { RandomSource } from '../shared/useGameLoop'

// Unidades lógicas en coordenadas de pantalla (y crece hacia abajo), vista de frente al arco.
export const VIEW_WIDTH = 64
export const VIEW_HEIGHT = 48
export const GOAL_LEFT = 10
export const GOAL_RIGHT = 54
export const GOAL_TOP = 12
export const GOAL_BOTTOM = 32
export const POST_THICKNESS = 2
/** Franja a cada lado de los palos donde el remate se va afuera. */
export const MISS_MARGIN = 5
export const INDICATOR_MIN = GOAL_LEFT - MISS_MARGIN
export const INDICATOR_MAX = GOAL_RIGHT + MISS_MARGIN
export const INITIAL_SPEED = 0.4
export const SPEED_INCREMENT = 0.075
/** Duración de la animación del remate (pelota volando y arquero tirándose). */
export const KICK_TICKS = 36
export const RESULT_TICKS = 60
export const TICK_MS = 1000 / 60

const ZONES = 3
const ZONE_WIDTH = (GOAL_RIGHT - GOAL_LEFT) / ZONES
const AIM_Y = 21
const AIM_ARM = 3
const AIM_THICKNESS = 2
const AIM_GAP = 2
const SPOT_X = VIEW_WIDTH / 2
const SPOT_Y = 40
const BALL_START_SIZE = 4
const BALL_END_SIZE = 2
const BALL_TARGET_Y = 20
const NET_SPACING = 4
const KEEPER_WIDTH = 8
const KEEPER_HEIGHT = 13
/** A partir de qué parte de la animación el arquero ya está estirado. */
const DIVE_POSE_FROM = 0.3
const FAINT = 'rgba(43, 51, 43, 0.28)'
const MEDIUM = 'rgba(43, 51, 43, 0.55)'

export type Outcome = 'goal' | 'saved' | 'out'
export type PenaltyPhase = 'aiming' | 'kicking' | 'result'

export interface PenaltiesState {
  phase: PenaltyPhase
  indicatorX: number
  direction: -1 | 1
  speed: number
  goals: number
  shotX: number | null
  keeperZone: number | null
  /** Se decide al patear pero se muestra recién al terminar la animación. */
  outcome: Outcome | null
  kickTicks: number
  resultTicks: number
  isOver: boolean
}

/** Zona del arco (0 izquierda, 1 centro, 2 derecha) o null si es afuera de los palos. */
export function zoneOf(x: number): number | null {
  if (x < GOAL_LEFT || x > GOAL_RIGHT) return null
  return Math.min(Math.floor((x - GOAL_LEFT) / ZONE_WIDTH), ZONES - 1)
}

function zoneCenter(zone: number): number {
  return GOAL_LEFT + ZONE_WIDTH * (zone + 0.5)
}

export function createPenalties(_random: RandomSource): PenaltiesState {
  return {
    phase: 'aiming',
    indicatorX: INDICATOR_MIN,
    direction: 1,
    speed: INITIAL_SPEED,
    goals: 0,
    shotX: null,
    keeperZone: null,
    outcome: null,
    kickTicks: 0,
    resultTicks: 0,
    isOver: false,
  }
}

export function shoot(state: PenaltiesState, random: RandomSource): PenaltiesState {
  if (state.phase !== 'aiming' || state.isOver) return state

  const shotX = state.indicatorX
  const keeperZone = Math.floor(random() * ZONES)
  const zone = zoneOf(shotX)
  const outcome: Outcome = zone === null ? 'out' : zone === keeperZone ? 'saved' : 'goal'

  return { ...state, phase: 'kicking', shotX, keeperZone, outcome, kickTicks: KICK_TICKS }
}

export function kickProgress(state: PenaltiesState): number {
  if (state.phase === 'kicking') return 1 - state.kickTicks / KICK_TICKS
  return state.shotX === null ? 0 : 1
}

function moveIndicator(state: PenaltiesState): PenaltiesState {
  let indicatorX = state.indicatorX + state.direction * state.speed
  let direction = state.direction
  if (indicatorX >= INDICATOR_MAX) {
    indicatorX = INDICATOR_MAX
    direction = -1
  } else if (indicatorX <= INDICATOR_MIN) {
    indicatorX = INDICATOR_MIN
    direction = 1
  }
  return { ...state, indicatorX, direction }
}

export function stepPenalties(state: PenaltiesState, _input: undefined, _random: RandomSource): PenaltiesState {
  if (state.isOver) return state

  if (state.phase === 'aiming') return moveIndicator(state)

  if (state.phase === 'kicking') {
    const kickTicks = state.kickTicks - 1
    if (kickTicks > 0) return { ...state, kickTicks }
    const scored = state.outcome === 'goal'
    return {
      ...state,
      phase: 'result',
      kickTicks: 0,
      resultTicks: RESULT_TICKS,
      goals: scored ? state.goals + 1 : state.goals,
      speed: scored ? state.speed + SPEED_INCREMENT : state.speed,
      isOver: !scored,
    }
  }

  const resultTicks = state.resultTicks - 1
  if (resultTicks > 0) return { ...state, resultTicks }
  return { ...state, phase: 'aiming', resultTicks: 0, shotX: null, keeperZone: null, outcome: null }
}

// --- Dibujo (pixel art en la paleta Nokia sin luz) ---

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

export function ballSprite(state: PenaltiesState): { x: number; y: number; size: number } {
  const progress = easeOut(kickProgress(state))
  const targetX = state.shotX ?? SPOT_X
  const size = BALL_START_SIZE + (BALL_END_SIZE - BALL_START_SIZE) * progress
  const centerX = SPOT_X + (targetX - SPOT_X) * progress
  const centerY = SPOT_Y + (BALL_TARGET_Y - SPOT_Y) * progress
  return { x: centerX - size / 2, y: centerY - size / 2, size }
}

function crowd(): PixelRect[] {
  const rects: PixelRect[] = []
  for (let x = 1; x < VIEW_WIDTH; x += 2) {
    rects.push({ x, y: 2 + (x % 4 === 1 ? 0 : 1), w: 1, h: 1, color: FAINT })
    rects.push({ x: x + 1, y: 5 + (x % 4 === 1 ? 1 : 0), w: 1, h: 1, color: FAINT })
  }
  rects.push({ x: 0, y: 8, w: VIEW_WIDTH, h: 1, color: MEDIUM })
  return rects
}

function goalFrame(state: PenaltiesState): PixelRect[] {
  const width = GOAL_RIGHT - GOAL_LEFT
  const height = GOAL_BOTTOM - GOAL_TOP
  const rects: PixelRect[] = []

  // Red: se sacude cuando entra la pelota.
  const ripple = state.phase === 'result' && state.outcome === 'goal' ? (state.resultTicks % 8 < 4 ? 1 : -1) : 0
  for (let x = GOAL_LEFT + NET_SPACING; x < GOAL_RIGHT; x += NET_SPACING) {
    rects.push({ x: x + ripple, y: GOAL_TOP, w: 1, h: height, color: FAINT })
  }
  for (let y = GOAL_TOP + NET_SPACING; y < GOAL_BOTTOM; y += NET_SPACING) {
    rects.push({ x: GOAL_LEFT, y: y + ripple, w: width, h: 1, color: FAINT })
  }

  // Divisiones de las tres zonas.
  for (let zone = 1; zone < ZONES; zone++) {
    const x = GOAL_LEFT + ZONE_WIDTH * zone
    for (let y = GOAL_TOP + 1; y < GOAL_BOTTOM; y += 3) rects.push({ x, y, w: 1, h: 2, color: MEDIUM })
  }

  rects.push(
    { x: GOAL_LEFT - POST_THICKNESS, y: GOAL_TOP - POST_THICKNESS, w: POST_THICKNESS, h: height + POST_THICKNESS },
    { x: GOAL_RIGHT, y: GOAL_TOP - POST_THICKNESS, w: POST_THICKNESS, h: height + POST_THICKNESS },
    { x: GOAL_LEFT - POST_THICKNESS, y: GOAL_TOP - POST_THICKNESS, w: width + POST_THICKNESS * 2, h: POST_THICKNESS },
    { x: 0, y: GOAL_BOTTOM, w: VIEW_WIDTH, h: 1 },
    { x: SPOT_X - 1, y: SPOT_Y + 3, w: 2, h: 1, color: MEDIUM },
  )
  return rects
}

function standingKeeper(centerX: number, armsUp: boolean): PixelRect[] {
  const x = centerX - KEEPER_WIDTH / 2
  const top = GOAL_BOTTOM - KEEPER_HEIGHT
  const arms: PixelRect[] = armsUp
    ? [
        { x, y: top - 2, w: 2, h: 2 },
        { x: x + KEEPER_WIDTH - 2, y: top - 2, w: 2, h: 2 },
        { x, y: top, w: 1, h: 4 },
        { x: x + KEEPER_WIDTH - 1, y: top, w: 1, h: 4 },
      ]
    : [
        { x, y: top + 4, w: 1, h: 4 },
        { x: x + KEEPER_WIDTH - 1, y: top + 4, w: 1, h: 4 },
        { x: x - 1, y: top + 8, w: 2, h: 2 },
        { x: x + KEEPER_WIDTH - 1, y: top + 8, w: 2, h: 2 },
      ]
  return [
    { x: x + 2, y: top, w: 4, h: 3 },
    { x: x + 1, y: top + 3, w: 6, h: 6 },
    { x: x + 3, y: top + 5, w: 2, h: 1, color: MEDIUM },
    { x: x + 1, y: top + 9, w: 2, h: 4 },
    { x: x + 5, y: top + 9, w: 2, h: 4 },
    ...arms,
  ]
}

function divingKeeper(centerX: number, side: -1 | 1): PixelRect[] {
  // Cuerpo estirado en el aire, con la cabeza y los guantes hacia el lado de la estirada.
  const bodyY = GOAL_BOTTOM - 11
  const bodyLeft = centerX - 6
  const head = side > 0 ? bodyLeft + 12 : bodyLeft - 3
  const gloves = side > 0 ? bodyLeft + 15 : bodyLeft - 5
  const legs = side > 0 ? bodyLeft - 4 : bodyLeft + 12
  return [
    { x: bodyLeft, y: bodyY, w: 12, h: 4 },
    { x: bodyLeft + 4, y: bodyY + 1, w: 3, h: 1, color: MEDIUM },
    { x: head, y: bodyY - 1, w: 3, h: 3 },
    { x: gloves, y: bodyY - 3, w: 2, h: 2 },
    { x: gloves, y: bodyY + 2, w: 2, h: 2 },
    { x: legs, y: bodyY + 1, w: 4, h: 2 },
  ]
}

function keeper(state: PenaltiesState): PixelRect[] {
  const center = (GOAL_LEFT + GOAL_RIGHT) / 2
  if (state.keeperZone === null) return standingKeeper(center, false)

  const progress = easeOut(kickProgress(state))
  const x = center + (zoneCenter(state.keeperZone) - center) * progress
  if (state.keeperZone === 1) return standingKeeper(x, progress > DIVE_POSE_FROM)
  if (progress < DIVE_POSE_FROM) return standingKeeper(x, false)
  return divingKeeper(x, state.keeperZone === 0 ? -1 : 1)
}

function ball(state: PenaltiesState): PixelRect[] {
  const { x, y, size } = ballSprite(state)
  // Círculo aproximado por filas: más angosto arriba y abajo, con un gajo claro en el medio.
  const row = size / 4
  return [
    { x: x + row, y, w: size - row * 2, h: row },
    { x, y: y + row, w: size, h: row * 2 },
    { x: x + row, y: y + row * 3, w: size - row * 2, h: row },
    { x: x + row * 1.5, y: y + row * 1.5, w: row, h: row, color: MEDIUM },
  ]
}

function aim(state: PenaltiesState): PixelRect[] {
  if (state.phase !== 'aiming') return []
  const half = AIM_THICKNESS / 2
  const x = state.indicatorX - half
  const y = AIM_Y - half
  const reach = AIM_GAP + AIM_ARM
  return [
    // Mira gruesa con hueco al centro, para que se distinga de la red.
    { x: x - reach, y, w: AIM_ARM, h: AIM_THICKNESS },
    { x: x + AIM_THICKNESS + AIM_GAP, y, w: AIM_ARM, h: AIM_THICKNESS },
    { x, y: y - reach, w: AIM_THICKNESS, h: AIM_ARM },
    { x, y: y + AIM_THICKNESS + AIM_GAP, w: AIM_THICKNESS, h: AIM_ARM },
    { x: x - reach - 1, y: y - reach - 1, w: 2, h: 1 },
    { x: x + reach + AIM_THICKNESS - 1, y: y - reach - 1, w: 2, h: 1 },
    { x: x - reach - 1, y: y + reach + AIM_THICKNESS, w: 2, h: 1 },
    { x: x + reach + AIM_THICKNESS - 1, y: y + reach + AIM_THICKNESS, w: 2, h: 1 },
  ]
}

/** Al terminar el remate se marca abajo del arco hacia dónde fue la pelota y hacia dónde el arquero. */
function resultMarkers(state: PenaltiesState): PixelRect[] {
  if (state.phase !== 'result' || state.keeperZone === null || state.shotX === null) return []
  const keeperLeft = GOAL_LEFT + ZONE_WIDTH * state.keeperZone
  return [
    { x: keeperLeft + 2, y: GOAL_BOTTOM + 2, w: ZONE_WIDTH - 4, h: 1 },
    { x: state.shotX - 1, y: GOAL_BOTTOM + 4, w: 3, h: 1 },
    { x: state.shotX, y: GOAL_BOTTOM + 3, w: 1, h: 3 },
  ]
}

export function toScreenRects(state: PenaltiesState): PixelRect[] {
  return [...crowd(), ...goalFrame(state), ...keeper(state), ...ball(state), ...aim(state), ...resultMarkers(state)]
}
