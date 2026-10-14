import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyPalette } from '../design/palettes'
import * as paletteService from './paletteService'
import { usePaletteSync } from './usePaletteSync'

vi.mock('./paletteService', () => ({
  fetchMyPalette: vi.fn(),
  saveMyPalette: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  applyPalette('tierra-media')
})

describe('usePaletteSync', () => {
  it('al entrar aplica la paleta guardada en mi perfil (ej. elegida en otro dispositivo)', async () => {
    vi.mocked(paletteService.fetchMyPalette).mockResolvedValue('celeste')

    renderHook(() => usePaletteSync('u1'))

    await waitFor(() => expect(document.documentElement.dataset.palette).toBe('celeste'))
  })

  it('sin usuario no consulta nada', () => {
    renderHook(() => usePaletteSync(null))

    expect(paletteService.fetchMyPalette).not.toHaveBeenCalled()
  })

  it('si falla la consulta se queda con la paleta cacheada', async () => {
    vi.mocked(paletteService.fetchMyPalette).mockRejectedValue(new Error('sin conexión'))

    renderHook(() => usePaletteSync('u1'))

    await waitFor(() => expect(paletteService.fetchMyPalette).toHaveBeenCalled())
    expect(document.documentElement.dataset.palette).toBe('tierra-media')
  })
})
