import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import { PALETTE_STORAGE_KEY, applyPalette } from '../design/palettes'
import * as paletteService from './paletteService'
import { PaletteSelector } from './PaletteSelector'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./paletteService', () => ({
  fetchMyPalette: vi.fn(),
  saveMyPalette: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  applyPalette('tierra-media')
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({ session: null, user: { id: 'u1' } as never, loading: false })
  vi.mocked(paletteService.saveMyPalette).mockResolvedValue()
})

describe('PaletteSelector', () => {
  it('muestra las 4 paletas con su muestra de colores y marca la activa', () => {
    render(<PaletteSelector />)

    expect(screen.getByRole('heading', { name: 'Paleta de colores' })).toBeInTheDocument()
    const options = screen.getAllByRole('button')
    expect(options.map((option) => option.textContent)).toEqual(['Tierra Media', 'Celeste', 'Noche', 'Cancha'])
    expect(screen.getByRole('button', { name: 'Tierra Media' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelectorAll('.palette-swatch').length).toBeGreaterThanOrEqual(4)
  })

  it('al elegir una paleta cambia la app al instante, la cachea y la guarda en mi perfil', async () => {
    render(<PaletteSelector />)

    fireEvent.click(screen.getByRole('button', { name: 'Noche' }))

    expect(document.documentElement.dataset.palette).toBe('noche')
    expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('noche')
    expect(screen.getByRole('button', { name: 'Noche' })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(paletteService.saveMyPalette).toHaveBeenCalledWith('u1', 'noche'))
  })

  it('si no se pudo guardar en el perfil avisa, pero la paleta queda aplicada', async () => {
    vi.mocked(paletteService.saveMyPalette).mockRejectedValue(new Error('sin conexión'))
    render(<PaletteSelector />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancha' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo guardar/i)
    expect(document.documentElement.dataset.palette).toBe('cancha')
  })
})
