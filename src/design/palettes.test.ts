import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_PALETTE,
  PALETTES,
  PALETTE_STORAGE_KEY,
  applyPalette,
  contrastRatio,
  deltaE,
  loadCachedPalette,
  type PaletteKey,
} from './palettes'

const WCAG_AA_TEXT = 4.5
/** Diferencia de color CIE76 a partir de la cual dos colores se distinguen claramente. */
const MIN_STATUS_DELTA_E = 30

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('style')
  delete document.documentElement.dataset.palette
})

describe('paletas', () => {
  it('hay 4 paletas: Tierra Media (por defecto), Celeste, Noche y Cancha', () => {
    expect(PALETTES.map((palette) => palette.name)).toEqual(['Tierra Media', 'Celeste', 'Noche', 'Cancha'])
    expect(DEFAULT_PALETTE).toBe('tierra-media')
  })

  describe.each(PALETTES.map((palette) => [palette.name, palette] as const))('%s', (_name, palette) => {
    const { tokens } = palette

    it('el texto principal cumple contraste AA sobre fondo y superficie', () => {
      expect(contrastRatio(tokens.ink, tokens.bg)).toBeGreaterThanOrEqual(WCAG_AA_TEXT)
      expect(contrastRatio(tokens.ink, tokens.surface)).toBeGreaterThanOrEqual(WCAG_AA_TEXT)
    })

    it('Exacto, Resultado y Pifiado cumplen AA como texto y se distinguen entre sí', () => {
      const statuses = [tokens.exacto, tokens.resultado, tokens.pifiado]
      for (const color of statuses) {
        expect(contrastRatio(color, tokens.bg)).toBeGreaterThanOrEqual(WCAG_AA_TEXT)
        expect(contrastRatio(color, tokens.surface)).toBeGreaterThanOrEqual(WCAG_AA_TEXT)
      }
      expect(deltaE(tokens.exacto, tokens.resultado)).toBeGreaterThanOrEqual(MIN_STATUS_DELTA_E)
      expect(deltaE(tokens.exacto, tokens.pifiado)).toBeGreaterThanOrEqual(MIN_STATUS_DELTA_E)
      expect(deltaE(tokens.resultado, tokens.pifiado)).toBeGreaterThanOrEqual(MIN_STATUS_DELTA_E)
    })

    it('el texto de los chips de posición cumple AA sobre su fondo', () => {
      for (const chip of [tokens.moss, tokens.gold, tokens.rust]) {
        expect(contrastRatio(tokens.chipInk, chip)).toBeGreaterThanOrEqual(WCAG_AA_TEXT)
      }
    })
  })
})

describe('applyPalette', () => {
  it('redefine los tokens en el root y la cachea en el dispositivo', () => {
    const noche = PALETTES.find((palette) => palette.key === 'noche')!

    applyPalette('noche')

    expect(document.documentElement.style.getPropertyValue('--bg')).toBe(noche.tokens.bg)
    expect(document.documentElement.style.getPropertyValue('--exacto')).toBe(noche.tokens.exacto)
    expect(document.documentElement.dataset.palette).toBe('noche')
    expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('noche')
  })
})

describe('loadCachedPalette', () => {
  it('devuelve la cacheada o Tierra Media si no hay o es inválida', () => {
    expect(loadCachedPalette()).toBe('tierra-media')
    localStorage.setItem(PALETTE_STORAGE_KEY, 'cancha')
    expect(loadCachedPalette()).toBe('cancha')
    localStorage.setItem(PALETTE_STORAGE_KEY, 'cualquiera')
    expect(loadCachedPalette()).toBe('tierra-media')
  })
})

describe('contrastRatio', () => {
  it('blanco sobre negro es 21', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21)
  })

  it('deltaE de blanco a negro es 100', () => {
    expect(deltaE('#ffffff', '#000000')).toBeCloseTo(100, 0)
  })

  it('acepta las claves de paleta como tipo', () => {
    const key: PaletteKey = 'celeste'
    expect(PALETTES.some((palette) => palette.key === key)).toBe(true)
  })
})
