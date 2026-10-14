import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { fetchMyPalette, saveMyPalette } from './paletteService'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

const mockedFrom = vi.mocked(supabase.from)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchMyPalette', () => {
  it('trae la paleta guardada en mi perfil', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { palette: 'celeste' }, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    mockedFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) } as never)

    expect(await fetchMyPalette('u1')).toBe('celeste')
    expect(mockedFrom).toHaveBeenCalledWith('profiles')
    expect(eq).toHaveBeenCalledWith('id', 'u1')
  })

  it('devuelve null si no hay perfil o la paleta no es conocida', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { palette: 'rosa' }, error: null })
    mockedFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) } as never)

    expect(await fetchMyPalette('u1')).toBeNull()
  })
})

describe('saveMyPalette', () => {
  it('actualiza la paleta de mi perfil', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ update } as never)

    await saveMyPalette('u1', 'noche')

    expect(update).toHaveBeenCalledWith({ palette: 'noche' })
    expect(eq).toHaveBeenCalledWith('id', 'u1')
  })

  it('propaga el error', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'denegado' } })
    mockedFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) } as never)

    await expect(saveMyPalette('u1', 'noche')).rejects.toThrow('denegado')
  })
})
