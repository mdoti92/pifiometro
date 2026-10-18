import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { isAllowed } from './accessService'

vi.mock('../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }))

const rpc = vi.mocked(supabase.rpc)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isAllowed', () => {
  it('consulta la whitelist propia de Pifiómetro', async () => {
    rpc.mockResolvedValue({ data: true, error: null } as never)

    expect(await isAllowed()).toBe(true)
    expect(rpc).toHaveBeenCalledWith('is_allowed')
  })

  it('devuelve false si el email no está en la whitelist', async () => {
    rpc.mockResolvedValue({ data: false, error: null } as never)

    expect(await isAllowed()).toBe(false)
  })

  it('si la consulta falla, tira un error en español', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } } as never)

    await expect(isAllowed()).rejects.toThrow('No se pudo verificar el acceso. Probá de nuevo.')
  })
})
