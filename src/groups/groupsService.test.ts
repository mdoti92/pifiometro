import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { createGroup, GroupNameRequiredError, joinGroup } from './groupsService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

const mockedFrom = vi.mocked(supabase.from)
const mockedRpc = vi.mocked(supabase.rpc)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createGroup', () => {
  it('lanza GroupNameRequiredError sin llamar a supabase cuando el nombre esta vacio', async () => {
    await expect(createGroup('   ', 'user-1')).rejects.toThrow(GroupNameRequiredError)
    expect(mockedFrom).not.toHaveBeenCalled()
  })

  it('crea el grupo con el creador indicado y devuelve el grupo generado, incluido el invite_code', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'group-1',
        name: 'Los pibes',
        invite_code: 'AB12CD',
        created_by: 'user-1',
        created_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mockedFrom.mockReturnValue({ insert } as never)

    const result = await createGroup('Los pibes', 'user-1')

    expect(mockedFrom).toHaveBeenCalledWith('groups')
    expect(insert).toHaveBeenCalledWith({ name: 'Los pibes', created_by: 'user-1' })
    expect(result).toEqual({
      id: 'group-1',
      name: 'Los pibes',
      inviteCode: 'AB12CD',
      createdBy: 'user-1',
      createdAt: '2026-01-01T00:00:00Z',
    })
  })

  it('recorta espacios del nombre antes de crear el grupo', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'group-1',
        name: 'Los pibes',
        invite_code: 'AB12CD',
        created_by: 'user-1',
        created_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mockedFrom.mockReturnValue({ insert } as never)

    await createGroup('  Los pibes  ', 'user-1')

    expect(insert).toHaveBeenCalledWith({ name: 'Los pibes', created_by: 'user-1' })
  })

  it('propaga el error de supabase cuando la creacion falla', async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mockedFrom.mockReturnValue({ insert } as never)

    await expect(createGroup('Los pibes', 'user-1')).rejects.toThrow('permission denied')
  })
})

describe('joinGroup', () => {
  it('llama a la RPC join_group con el codigo ingresado y devuelve el id del grupo', async () => {
    mockedRpc.mockResolvedValue({ data: 'group-1', error: null } as never)

    const groupId = await joinGroup('AB12CD')

    expect(mockedRpc).toHaveBeenCalledWith('join_group', { p_invite_code: 'AB12CD' })
    expect(groupId).toBe('group-1')
  })

  it('propaga el error de la RPC cuando el codigo es invalido', async () => {
    mockedRpc.mockResolvedValue({
      data: null,
      error: { message: 'Codigo de invitacion invalido' },
    } as never)

    await expect(joinGroup('NOEXISTE')).rejects.toThrow('Codigo de invitacion invalido')
  })

  it('no falla al reingresar un codigo de un grupo del que ya soy miembro', async () => {
    mockedRpc.mockResolvedValue({ data: 'group-1', error: null } as never)

    await expect(joinGroup('AB12CD')).resolves.toBe('group-1')
  })
})
