import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import {
  activateTournament,
  deactivateTournament,
  listAvailableTournaments,
  listGroupTournaments,
  pickSoleActiveTournament,
} from './groupTournamentsService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockedFrom = vi.mocked(supabase.from)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listAvailableTournaments', () => {
  it('lista todos los torneos disponibles en la plataforma', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: 'tournament-1', name: 'Liga AUF 2026', season: '2026' }],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ order })
    mockedFrom.mockReturnValue({ select } as never)

    const tournaments = await listAvailableTournaments()

    expect(mockedFrom).toHaveBeenCalledWith('tournaments')
    expect(tournaments).toEqual([{ id: 'tournament-1', name: 'Liga AUF 2026', season: '2026' }])
  })
})

describe('listGroupTournaments', () => {
  it('lista los torneos del grupo con su estado activo/inactivo', async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [
        {
          tournament_id: 'tournament-1',
          active: true,
          tournaments: { name: 'Liga AUF 2026', season: '2026' },
        },
      ],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    const groupTournaments = await listGroupTournaments('group-1')

    expect(eq).toHaveBeenCalledWith('group_id', 'group-1')
    expect(groupTournaments).toEqual([
      { tournamentId: 'tournament-1', name: 'Liga AUF 2026', season: '2026', active: true },
    ])
  })

  it('propaga el error cuando falla la consulta', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(listGroupTournaments('group-1')).rejects.toThrow('permission denied')
  })
})

describe('activateTournament', () => {
  it('activa el torneo para el grupo (upsert por group_id + tournament_id)', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    mockedFrom.mockReturnValue({ upsert } as never)

    await activateTournament('group-1', 'tournament-1')

    expect(mockedFrom).toHaveBeenCalledWith('group_tournaments')
    expect(upsert).toHaveBeenCalledWith(
      { group_id: 'group-1', tournament_id: 'tournament-1', active: true },
      { onConflict: 'group_id,tournament_id' },
    )
  })

  it('propaga el error cuando no soy admin del grupo', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'permission denied' } })
    mockedFrom.mockReturnValue({ upsert } as never)

    await expect(activateTournament('group-1', 'tournament-1')).rejects.toThrow(
      'permission denied',
    )
  })
})

describe('deactivateTournament', () => {
  it('desactiva el torneo sin borrar el historico', async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: null })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const update = vi.fn().mockReturnValue({ eq: eq1 })
    mockedFrom.mockReturnValue({ update } as never)

    await deactivateTournament('group-1', 'tournament-1')

    expect(update).toHaveBeenCalledWith({ active: false })
    expect(eq1).toHaveBeenCalledWith('group_id', 'group-1')
    expect(eq2).toHaveBeenCalledWith('tournament_id', 'tournament-1')
  })

  it('propaga el error cuando no soy admin del grupo', async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: { message: 'permission denied' } })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const update = vi.fn().mockReturnValue({ eq: eq1 })
    mockedFrom.mockReturnValue({ update } as never)

    await expect(deactivateTournament('group-1', 'tournament-1')).rejects.toThrow(
      'permission denied',
    )
  })
})

describe('pickSoleActiveTournament', () => {
  it('devuelve el torneo activo cuando hay exactamente uno', () => {
    const active = { tournamentId: 'tournament-1', name: 'Liga AUF 2026', season: '2026', active: true }
    const inactive = { tournamentId: 'tournament-2', name: 'Copa AUF', season: '2026', active: false }

    expect(pickSoleActiveTournament([active, inactive])).toEqual(active)
  })

  it('devuelve null cuando no hay ningun torneo activo', () => {
    const inactive = { tournamentId: 'tournament-2', name: 'Copa AUF', season: '2026', active: false }

    expect(pickSoleActiveTournament([inactive])).toBeNull()
  })

  it('devuelve null cuando hay mas de un torneo activo, para no elegir arbitrariamente', () => {
    const active1 = { tournamentId: 'tournament-1', name: 'Liga AUF 2026', season: '2026', active: true }
    const active2 = { tournamentId: 'tournament-2', name: 'Copa AUF', season: '2026', active: true }

    expect(pickSoleActiveTournament([active1, active2])).toBeNull()
  })
})
