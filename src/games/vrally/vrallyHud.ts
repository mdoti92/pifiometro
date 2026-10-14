import type { PixelRect } from '../shared/PixelCanvas'
import { CHECKPOINT_COUNT, MAX_SPEED, SEGMENT_LENGTH, segmentAt, type VRallyState } from './vrally'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './vrallyRender'

/** Distancia antes de una curva a la que el copiloto la anuncia. */
export const COPILOT_LOOKAHEAD = SEGMENT_LENGTH * 40
export const DIFF_DISPLAY_MS = 3000
/** A partir de esta fracción de la velocidad máxima la barra se pinta en rojo. */
export const SPEED_RED_THRESHOLD = 0.85
export const BEST_SPLITS_STORAGE_KEY = 'pifiometro.games.vrally.bestSplits'

const HUD_MARGIN = 3
const GLYPH_WIDTH = 3
const GLYPH_SPACING = 1
const SPEED_BAR_WIDTH = 40
const SPEED_BAR_HEIGHT = 4

const COLORS = {
  text: '#ffffff',
  shadow: '#000000',
  slower: '#e0302a',
  faster: '#3fd06a',
  barEmpty: '#2a2a2a',
  barYellow: '#f2c230',
  barRed: '#e0302a',
  arrow: '#ffd84d',
}

// Fuente bitmap de 3x5: cada fila es un patrón de 3 bits.
const GLYPHS: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '+': ['000', '010', '111', '010', '000'],
  '-': ['000', '000', '111', '000', '000'],
  '.': ['000', '000', '000', '000', '010'],
  '/': ['001', '001', '010', '100', '100'],
  ':': ['000', '010', '000', '010', '000'],
}

export function pixelText(text: string, x: number, y: number, color: string): PixelRect[] {
  const rects: PixelRect[] = []
  ;[...text].forEach((char, index) => {
    const glyph = GLYPHS[char]
    if (!glyph) return
    const left = x + index * (GLYPH_WIDTH + GLYPH_SPACING)
    glyph.forEach((row, rowIndex) => {
      ;[...row].forEach((bit, column) => {
        if (bit === '1') rects.push({ x: left + column, y: y + rowIndex, w: 1, h: 1, color })
      })
    })
  })
  return rects
}

function textWidth(text: string): number {
  return text.length * (GLYPH_WIDTH + GLYPH_SPACING) - GLYPH_SPACING
}

/** Texto con sombra de 1 píxel para que se lea sobre el cielo. */
function shadowedText(text: string, x: number, y: number, color: string): PixelRect[] {
  return [...pixelText(text, x + 1, y + 1, COLORS.shadow), ...pixelText(text, x, y, color)]
}

/** -1 curva a la izquierda, 1 a la derecha, 0 sin curva cerca. */
export function copilotDirection(position: number): -1 | 0 | 1 {
  for (let ahead = 0; ahead <= COPILOT_LOOKAHEAD; ahead += SEGMENT_LENGTH) {
    const curve = segmentAt(position + ahead).curve
    if (curve !== 0) return curve < 0 ? -1 : 1
  }
  return 0
}

export function visibleDiff(state: VRallyState): number | null {
  if (!state.lastDiff || state.elapsedMs - state.lastDiff.atMs > DIFF_DISPLAY_MS) return null
  return state.lastDiff.tenths
}

function formatDiff(tenths: number): string {
  const sign = tenths > 0 ? '+' : '-'
  const absolute = Math.abs(tenths)
  return `${sign}${Math.floor(absolute / 10)}.${absolute % 10}`
}

interface StoredSplits {
  totalTenths: number
  splits: number[]
}

function readStored(): StoredSplits | null {
  try {
    const raw = localStorage.getItem(BEST_SPLITS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredSplits) : null
  } catch {
    return null
  }
}

export function loadBestSplits(): number[] | null {
  return readStored()?.splits ?? null
}

export function saveBestSplitsIfBetter(totalTenths: number, splits: number[]): void {
  const stored = readStored()
  if (stored && stored.totalTenths <= totalTenths) return
  localStorage.setItem(BEST_SPLITS_STORAGE_KEY, JSON.stringify({ totalTenths, splits }))
}

function arrow(direction: -1 | 1): PixelRect[] {
  const centerX = SCREEN_WIDTH / 2
  const y = HUD_MARGIN
  const rects: PixelRect[] = [{ x: centerX - 5, y: y + 3, w: 10, h: 3, color: COLORS.arrow }]
  // Punta de la flecha: columnas que se achican hacia el lado de la curva.
  for (let i = 0; i < 5; i++) {
    const x = direction > 0 ? centerX + 5 + i : centerX - 6 - i
    rects.push({ x, y: y + i, w: 1, h: 9 - i * 2, color: COLORS.arrow })
  }
  return rects
}

function speedBar(speed: number): PixelRect[] {
  const x = SCREEN_WIDTH - SPEED_BAR_WIDTH - HUD_MARGIN
  const y = SCREEN_HEIGHT - SPEED_BAR_HEIGHT - HUD_MARGIN
  const filled = Math.round((speed / MAX_SPEED) * SPEED_BAR_WIDTH)
  const redFrom = Math.round(SPEED_RED_THRESHOLD * SPEED_BAR_WIDTH)
  const rects: PixelRect[] = [{ x, y, w: SPEED_BAR_WIDTH, h: SPEED_BAR_HEIGHT, color: COLORS.barEmpty }]
  if (filled > 0) rects.push({ x, y, w: Math.min(filled, redFrom), h: SPEED_BAR_HEIGHT, color: COLORS.barYellow })
  if (filled > redFrom) rects.push({ x: x + redFrom, y, w: filled - redFrom, h: SPEED_BAR_HEIGHT, color: COLORS.barRed })
  return rects
}

export function renderHud(state: VRallyState): PixelRect[] {
  const rects: PixelRect[] = []

  const direction = copilotDirection(state.position)
  if (direction !== 0) rects.push(...arrow(direction))

  const checkpoints = `${state.splits.length}/${CHECKPOINT_COUNT}`
  rects.push(...shadowedText(checkpoints, SCREEN_WIDTH - textWidth(checkpoints) - HUD_MARGIN, HUD_MARGIN, COLORS.text))

  const diff = visibleDiff(state)
  if (diff !== null) rects.push(...shadowedText(formatDiff(diff), HUD_MARGIN, HUD_MARGIN, diff > 0 ? COLORS.slower : COLORS.faster))

  rects.push(...speedBar(state.speed))
  return rects
}
