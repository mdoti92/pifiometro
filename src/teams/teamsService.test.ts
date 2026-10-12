import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { getTeamDisplayName, listTeams } from './teamsService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockedFrom = vi.mocked(supabase.from)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listTeams', () => {
  it('lista los equipos ordenados por nombre', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: 'team-1', name: 'Danubio', alias: 'Diluvio', slug: 'danubio' }],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ order })
    mockedFrom.mockReturnValue({ select } as never)

    const teams = await listTeams()

    expect(mockedFrom).toHaveBeenCalledWith('teams')
    expect(teams).toEqual([{ id: 'team-1', name: 'Danubio', alias: 'Diluvio', slug: 'danubio' }])
  })

  it('propaga el error de supabase', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const select = vi.fn().mockReturnValue({ order })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(listTeams()).rejects.toThrow('permission denied')
  })
})

describe('getTeamDisplayName', () => {
  it('usa el alias cuando existe', () => {
    expect(getTeamDisplayName({ name: 'Danubio', alias: 'Diluvio' })).toBe('Diluvio')
  })

  it('usa el nombre real cuando no hay alias', () => {
    expect(getTeamDisplayName({ name: 'Danubio', alias: null })).toBe('Danubio')
  })

  it('devuelve string vacio cuando no hay equipo', () => {
    expect(getTeamDisplayName(null)).toBe('')
    expect(getTeamDisplayName(undefined)).toBe('')
  })
})
