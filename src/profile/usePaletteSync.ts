import { useEffect } from 'react'
import { applyPalette, currentPalette } from '../design/palettes'
import { fetchMyPalette } from './paletteService'

/** Al entrar, aplica la paleta guardada en el perfil (puede haberse elegido en otro dispositivo). */
export function usePaletteSync(userId: string | null) {
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    fetchMyPalette(userId)
      .then((palette) => {
        if (!cancelled && palette && palette !== currentPalette()) applyPalette(palette)
      })
      .catch(() => {
        // Sin conexión queda la paleta cacheada en el dispositivo.
      })

    return () => {
      cancelled = true
    }
  }, [userId])
}
