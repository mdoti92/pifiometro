import { beforeEach, describe, expect, it } from 'vitest'
import {
  BEST_SPLITS_STORAGE_KEY,
  COPILOT_LOOKAHEAD,
  DIFF_DISPLAY_MS,
  SPEED_RED_THRESHOLD,
  copilotDirection,
  loadBestSplits,
  pixelText,
  renderHud,
  saveBestSplitsIfBetter,
  visibleDiff,
} from './vrallyHud'
import {
  CHECKPOINT_COUNT,
  MAX_SPEED,
  SEGMENT_LENGTH,
  TRACK,
  createVRally,
  stepVRally,
  trackLength,
  type VRallyState,
} from './vrally'

const none = () => 0.5

function state(overrides: Partial<VRallyState> = {}): VRallyState {
  return { ...createVRally(none), ...overrides }
}

beforeEach(() => {
  localStorage.clear()
})

describe('checkpoints', () => {
  it('el tramo tiene 8 checkpoints repartidos en orden a lo largo del recorrido', () => {
    expect(CHECKPOINT_COUNT).toBe(8)
    expect(TRACK.checkpoints).toHaveLength(8)
    const sorted = [...TRACK.checkpoints].sort((a, b) => a - b)
    expect(TRACK.checkpoints).toEqual(sorted)
    expect(TRACK.checkpoints[7] * SEGMENT_LENGTH).toBeLessThanOrEqual(trackLength())
  })

  it('al cruzar un checkpoint cuenta y guarda el parcial', () => {
    const at = TRACK.checkpoints[0] * SEGMENT_LENGTH
    const next = stepVRally(state({ position: at - 1, speed: MAX_SPEED, elapsedMs: 5000 }), 0, none)

    expect(next.splits).toHaveLength(1)
    expect(next.splits[0]).toBeCloseTo(5000 + 1000 / 60)
  })

  it('con un mejor tiempo previo, muestra la diferencia en ese checkpoint', () => {
    const at = TRACK.checkpoints[0] * SEGMENT_LENGTH
    const withBest = state({ position: at - 1, speed: MAX_SPEED, elapsedMs: 5400, bestSplits: [5000] })

    const next = stepVRally(withBest, 0, none)

    expect(next.lastDiff?.tenths).toBe(4)
    expect(visibleDiff(next)).toBe(4)
    expect(visibleDiff({ ...next, elapsedMs: next.elapsedMs + DIFF_DISPLAY_MS + 1 })).toBeNull()
  })

  it('sin mejor tiempo previo no hay diferencia', () => {
    const at = TRACK.checkpoints[0] * SEGMENT_LENGTH
    const next = stepVRally(state({ position: at - 1, speed: MAX_SPEED }), 0, none)

    expect(next.lastDiff).toBeNull()
  })
})

describe('parciales del mejor tiempo', () => {
  it('se guardan solo si la carrera mejora el mejor tiempo', () => {
    expect(loadBestSplits()).toBeNull()

    saveBestSplitsIfBetter(700, [1, 2, 3])
    expect(loadBestSplits()).toEqual([1, 2, 3])

    saveBestSplitsIfBetter(800, [9, 9, 9])
    expect(loadBestSplits()).toEqual([1, 2, 3])

    saveBestSplitsIfBetter(650, [4, 5, 6])
    expect(loadBestSplits()).toEqual([4, 5, 6])
    expect(localStorage.getItem(BEST_SPLITS_STORAGE_KEY)).toContain('650')
  })
})

describe('copiloto', () => {
  it('anticipa la próxima curva con la dirección correcta y desaparece en recta', () => {
    const firstCurve = TRACK.segments.findIndex((segment) => segment.curve !== 0)
    const direction = Math.sign(TRACK.segments[firstCurve].curve)

    expect(copilotDirection(0)).toBe(0)
    expect(copilotDirection(firstCurve * SEGMENT_LENGTH - COPILOT_LOOKAHEAD / 2)).toBe(direction)
    expect(copilotDirection(firstCurve * SEGMENT_LENGTH + 1)).toBe(direction)
  })
})

describe('renderHud', () => {
  it('dibuja contador de checkpoints, barra de velocidad con tramo rojo cerca del máximo', () => {
    const fast = renderHud(state({ speed: MAX_SPEED, splits: [1, 2] }))
    const slow = renderHud(state({ speed: MAX_SPEED * (SPEED_RED_THRESHOLD - 0.2) }))

    const red = (rects: ReturnType<typeof renderHud>) => rects.filter((rect) => rect.color === '#e0302a')
    expect(red(fast).length).toBeGreaterThan(0)
    expect(red(slow)).toHaveLength(0)
  })

  it('pixelText dibuja caracteres con bloques de píxeles', () => {
    expect(pixelText('2/8', 0, 0, '#fff').length).toBeGreaterThan(5)
    expect(pixelText('+0.4', 0, 0, '#fff').length).toBeGreaterThan(5)
  })
})
