import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { createGroup, GroupNameRequiredError, joinGroup, listMyGroups } from './groupsService'

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

  // El enforcement real de created_by = auth.uid() es responsabilidad de RLS en
  // Postgres (ver supabase/migrations/20260905000002_*.sql); este test solo
  // verifica el contrato del payload que arma el cliente.
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

  it('propaga el error de supabase cuando la creacion falla, por ejemplo por una policy de RLS', async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'new row violates row-level security policy for table "groups"' },
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mockedFrom.mockReturnValue({ insert } as never)

    await expect(createGroup('Los pibes', 'user-1')).rejects.toThrow(
      'new row violates row-level security policy for table "groups"',
    )
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

describe('listMyGroups', () => {
  it('devuelve los grupos de los que el usuario es miembro', async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [
        { group_id: 'group-1', groups: { id: 'group-1', name: 'Los pibes' } },
        { group_id: 'group-2', groups: { id: 'group-2', name: 'La barra' } },
      ],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    const groups = await listMyGroups('user-1')

    expect(mockedFrom).toHaveBeenCalledWith('group_members')
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(groups).toEqual([
      { id: 'group-1', name: 'Los pibes' },
      { id: 'group-2', name: 'La barra' },
    ])
  })

  it('propaga el error de supabase', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'no autenticado' } })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(listMyGroups('user-1')).rejects.toThrow('no autenticado')
  })
})
