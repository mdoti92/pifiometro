export type PaletteKey = 'tierra-media' | 'celeste' | 'noche' | 'cancha'

export interface PaletteTokens {
  bg: string
  surface: string
  ink: string
  hearth: string
  moss: string
  gold: string
  rust: string
  steel: string
  /** Colores de texto de Exacto / Resultado / Pifiado. */
  exacto: string
  resultado: string
  pifiado: string
  /** Texto sobre los chips de posición (fondos moss / gold / rust). */
  chipInk: string
}

export interface Palette {
  key: PaletteKey
  name: string
  colorScheme: 'light' | 'dark'
  tokens: PaletteTokens
}

export const DEFAULT_PALETTE: PaletteKey = 'tierra-media'
export const PALETTE_STORAGE_KEY = 'pifiometro.palette'

export const PALETTES: Palette[] = [
  {
    key: 'tierra-media',
    name: 'Tierra Media',
    colorScheme: 'dark',
    tokens: {
      bg: '#12140f',
      surface: '#1e2318',
      ink: '#ede3ce',
      hearth: '#c97a2e',
      moss: '#86ad79',
      gold: '#c9a63e',
      rust: '#e8686f',
      steel: '#4a5568',
      exacto: '#c97a2e',
      resultado: '#86ad79',
      pifiado: '#e8686f',
      chipInk: '#12140f',
    },
  },
  {
    key: 'celeste',
    name: 'Celeste',
    colorScheme: 'light',
    tokens: {
      bg: '#eef6fc',
      surface: '#ffffff',
      ink: '#10314d',
      hearth: '#0b5fa5',
      moss: '#2e7a3e',
      gold: '#7a5c00',
      rust: '#b42318',
      steel: '#7b93a8',
      exacto: '#0b5fa5',
      resultado: '#2e7a3e',
      pifiado: '#b42318',
      chipInk: '#ffffff',
    },
  },
  {
    key: 'noche',
    name: 'Noche',
    colorScheme: 'dark',
    tokens: {
      bg: '#0b0d12',
      surface: '#171b24',
      ink: '#e6e9f0',
      hearth: '#f2a65a',
      moss: '#6fd08c',
      gold: '#e8c35a',
      rust: '#ff7b7b',
      steel: '#525c70',
      exacto: '#f2a65a',
      resultado: '#6fd08c',
      pifiado: '#ff7b7b',
      chipInk: '#0b0d12',
    },
  },
  {
    key: 'cancha',
    name: 'Cancha',
    colorScheme: 'dark',
    tokens: {
      bg: '#0e3a20',
      surface: '#15502d',
      ink: '#ffffff',
      hearth: '#ffd84d',
      moss: '#b6f0ad',
      gold: '#f2c94c',
      rust: '#ffb3a8',
      steel: '#5f9a72',
      exacto: '#ffd84d',
      resultado: '#b6f0ad',
      pifiado: '#ffb3a8',
      chipInk: '#0e3a20',
    },
  },
]

function isPaletteKey(value: string | null): value is PaletteKey {
  return PALETTES.some((palette) => palette.key === value)
}

export function paletteByKey(key: string | null): Palette {
  return PALETTES.find((palette) => palette.key === key) ?? (PALETTES[0] as Palette)
}

function cssVariableName(token: string): string {
  return `--${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
}

/** Redefine los tokens CSS en el root (cambia toda la app al instante) y la cachea en el dispositivo. */
export function applyPalette(key: PaletteKey) {
  const palette = paletteByKey(key)
  const root = document.documentElement
  for (const [token, value] of Object.entries(palette.tokens)) root.style.setProperty(cssVariableName(token), value)
  root.style.setProperty('color-scheme', palette.colorScheme)
  root.dataset.palette = palette.key
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, palette.key)
  } catch {
    // Sin almacenamiento disponible la paleta se aplica igual, solo no queda cacheada.
  }
}

export function loadCachedPalette(): PaletteKey {
  try {
    const cached = localStorage.getItem(PALETTE_STORAGE_KEY)
    return isPaletteKey(cached) ? cached : DEFAULT_PALETTE
  } catch {
    return DEFAULT_PALETTE
  }
}

export function currentPalette(): PaletteKey {
  const applied = document.documentElement.dataset.palette ?? null
  return isPaletteKey(applied) ? applied : DEFAULT_PALETTE
}

// --- Contraste y diferencia de color (WCAG 2.x y CIE76) ---

function channels(hex: string): number[] {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
}

function linear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map(linear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

const D65 = [0.95047, 1, 1.08883]

function toLab(hex: string): number[] {
  const [r, g, b] = channels(hex).map(linear)
  const xyz = [
    (r * 0.4124 + g * 0.3576 + b * 0.1805) / D65[0],
    (r * 0.2126 + g * 0.7152 + b * 0.0722) / D65[1],
    (r * 0.0193 + g * 0.1192 + b * 0.9505) / D65[2],
  ].map((t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116))
  return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])]
}

export function deltaE(a: string, b: string): number {
  const [labA, labB] = [toLab(a), toLab(b)]
  return Math.hypot(labA[0] - labB[0], labA[1] - labB[1], labA[2] - labB[2])
}
