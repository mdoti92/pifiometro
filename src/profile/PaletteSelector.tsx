import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { PALETTES, applyPalette, currentPalette, type PaletteKey } from '../design/palettes'
import { saveMyPalette } from './paletteService'

const SWATCH_TOKENS = ['bg', 'surface', 'ink', 'exacto', 'resultado', 'pifiado'] as const

export function PaletteSelector() {
  const { user } = useAuth()
  const [active, setActive] = useState<PaletteKey>(currentPalette)
  const [saveFailed, setSaveFailed] = useState(false)

  function choose(palette: PaletteKey) {
    applyPalette(palette)
    setActive(palette)
    setSaveFailed(false)
    if (!user) return
    saveMyPalette(user.id, palette).catch(() => setSaveFailed(true))
  }

  return (
    <section>
      <h2>Paleta de colores</h2>
      <div className="palette-options">
        {PALETTES.map((palette) => (
          <button
            key={palette.key}
            type="button"
            className="palette-option"
            aria-pressed={palette.key === active}
            aria-label={palette.name}
            onClick={() => choose(palette.key)}
          >
            <span className="palette-swatches" aria-hidden="true">
              {SWATCH_TOKENS.map((token) => (
                <span key={token} className="palette-swatch" style={{ background: palette.tokens[token] }} />
              ))}
            </span>
            {palette.name}
          </button>
        ))}
      </div>
      {saveFailed && <p role="alert">No se pudo guardar en tu perfil; la paleta queda solo en este dispositivo.</p>}
    </section>
  )
}
