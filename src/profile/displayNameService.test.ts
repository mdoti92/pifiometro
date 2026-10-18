import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { fetchMyDisplayName, saveMyDisplayName } from './displayNameService'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

const mockedFrom = vi.mocked(supabase.from)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchMyDisplayName', () => {
  it('trae el nombre visible de mi perfil', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { display_name: 'Doti' }, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    expect(await fetchMyDisplayName('u1')).toBe('Doti')
    expect(mockedFrom).toHaveBeenCalledWith('profiles')
    expect(select).toHaveBeenCalledWith('display_name')
    expect(eq).toHaveBeenCalledWith('id', 'u1')
  })

  it('devuelve null si no hay perfil', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    mockedFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) } as never)

    expect(await fetchMyDisplayName('u1')).toBeNull()
  })
})

describe('saveMyDisplayName', () => {
  it('guarda el nombre sin espacios sobrantes', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ update } as never)

    await saveMyDisplayName('u1', '  Doti  ')

    expect(update).toHaveBeenCalledWith({ display_name: 'Doti' })
    expect(eq).toHaveBeenCalledWith('id', 'u1')
  })

  it('rechaza un nombre vacio sin tocar la base', async () => {
    await expect(saveMyDisplayName('u1', '   ')).rejects.toThrow('El nombre no puede estar vacío')
    expect(mockedFrom).not.toHaveBeenCalled()
  })

  it('propaga el error de la base', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'permission denied' } })
    mockedFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) } as never)

    await expect(saveMyDisplayName('u1', 'Doti')).rejects.toThrow('permission denied')
  })
})
