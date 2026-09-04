import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import {
  isGroupAdmin,
  listMembers,
  regenerateInviteCode,
  removeMember,
} from './groupMembersService'

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

describe('listMembers', () => {
  it('lista los miembros del grupo con su nombre y rol', async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [
        { user_id: 'user-1', role: 'admin', joined_at: '2026-01-01T00:00:00Z', profiles: { display_name: 'Doti' } },
        { user_id: 'user-2', role: 'member', joined_at: '2026-01-02T00:00:00Z', profiles: { display_name: 'Aldo' } },
      ],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    const members = await listMembers('group-1')

    expect(mockedFrom).toHaveBeenCalledWith('group_members')
    expect(eq).toHaveBeenCalledWith('group_id', 'group-1')
    expect(members).toEqual([
      { userId: 'user-1', displayName: 'Doti', role: 'admin', joinedAt: '2026-01-01T00:00:00Z' },
      { userId: 'user-2', displayName: 'Aldo', role: 'member', joinedAt: '2026-01-02T00:00:00Z' },
    ])
  })

  it('propaga el error cuando falla la consulta', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(listMembers('group-1')).rejects.toThrow('permission denied')
  })
})

describe('isGroupAdmin', () => {
  it('devuelve true cuando la RPC confirma que soy admin', async () => {
    mockedRpc.mockResolvedValue({ data: true, error: null } as never)

    const result = await isGroupAdmin('group-1')

    expect(mockedRpc).toHaveBeenCalledWith('is_group_admin', { p_group_id: 'group-1' })
    expect(result).toBe(true)
  })

  it('devuelve false cuando la RPC confirma que no soy admin', async () => {
    mockedRpc.mockResolvedValue({ data: false, error: null } as never)

    await expect(isGroupAdmin('group-1')).resolves.toBe(false)
  })
})

describe('removeMember', () => {
  it('elimina la membresia del grupo indicado', async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: null })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const del = vi.fn().mockReturnValue({ eq: eq1 })
    mockedFrom.mockReturnValue({ delete: del } as never)

    await removeMember('group-1', 'user-2')

    expect(mockedFrom).toHaveBeenCalledWith('group_members')
    expect(eq1).toHaveBeenCalledWith('group_id', 'group-1')
    expect(eq2).toHaveBeenCalledWith('user_id', 'user-2')
  })

  it('propaga el error cuando la base rechaza el borrado', async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: { message: 'permission denied' } })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const del = vi.fn().mockReturnValue({ eq: eq1 })
    mockedFrom.mockReturnValue({ delete: del } as never)

    await expect(removeMember('group-1', 'user-2')).rejects.toThrow('permission denied')
  })
})

describe('regenerateInviteCode', () => {
  it('devuelve el nuevo codigo de invitacion', async () => {
    mockedRpc.mockResolvedValue({ data: 'ZZ99YY', error: null } as never)

    const code = await regenerateInviteCode('group-1')

    expect(mockedRpc).toHaveBeenCalledWith('regenerate_invite_code', { p_group_id: 'group-1' })
    expect(code).toBe('ZZ99YY')
  })

  it('propaga el error cuando quien lo pide no es admin', async () => {
    mockedRpc.mockResolvedValue({
      data: null,
      error: { message: 'Solo el admin del grupo puede regenerar el codigo' },
    } as never)

    await expect(regenerateInviteCode('group-1')).rejects.toThrow(
      'Solo el admin del grupo puede regenerar el codigo',
    )
  })
})
