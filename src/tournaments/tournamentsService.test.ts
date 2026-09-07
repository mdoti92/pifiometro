import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import {
  createTournament,
  getCurrentStage,
  isSuperadmin,
  listTournamentStages,
  renameStage,
} from './tournamentsService'

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

describe('createTournament', () => {
  it('crea el torneo y sus etapas en el orden ingresado', async () => {
    const tournamentSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: 'tournament-1', name: 'Liga AUF 2026', season: '2026' }, error: null })
    const tournamentSelect = vi.fn().mockReturnValue({ single: tournamentSingle })
    const tournamentInsert = vi.fn().mockReturnValue({ select: tournamentSelect })

    const stagesInsert = vi.fn().mockResolvedValue({ error: null })

    mockedFrom.mockImplementation((table: string) => {
      if (table === 'tournaments') return { insert: tournamentInsert } as never
      if (table === 'tournament_stages') return { insert: stagesInsert } as never
      throw new Error(`tabla inesperada: ${table}`)
    })

    const result = await createTournament('Liga AUF 2026', '2026', ['Apertura', 'Clausura'])

    expect(tournamentInsert).toHaveBeenCalledWith({ name: 'Liga AUF 2026', season: '2026' })
    expect(stagesInsert).toHaveBeenCalledWith([
      { tournament_id: 'tournament-1', name: 'Apertura', order_index: 0 },
      { tournament_id: 'tournament-1', name: 'Clausura', order_index: 1 },
    ])
    expect(result).toEqual({ id: 'tournament-1', name: 'Liga AUF 2026', season: '2026' })
  })

  it('propaga el error cuando falla la creacion del torneo', async () => {
    const tournamentSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const tournamentSelect = vi.fn().mockReturnValue({ single: tournamentSingle })
    const tournamentInsert = vi.fn().mockReturnValue({ select: tournamentSelect })
    mockedFrom.mockReturnValue({ insert: tournamentInsert } as never)

    await expect(createTournament('Liga AUF 2026', '2026', ['Apertura'])).rejects.toThrow(
      'permission denied',
    )
  })

  it('propaga el error cuando falla la creacion de las etapas', async () => {
    const tournamentSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: 'tournament-1', name: 'Liga AUF 2026', season: '2026' }, error: null })
    const tournamentSelect = vi.fn().mockReturnValue({ single: tournamentSingle })
    const tournamentInsert = vi.fn().mockReturnValue({ select: tournamentSelect })
    const stagesInsert = vi.fn().mockResolvedValue({ error: { message: 'permission denied' } })

    mockedFrom.mockImplementation((table: string) => {
      if (table === 'tournaments') return { insert: tournamentInsert } as never
      if (table === 'tournament_stages') return { insert: stagesInsert } as never
      throw new Error(`tabla inesperada: ${table}`)
    })

    await expect(createTournament('Liga AUF 2026', '2026', ['Apertura'])).rejects.toThrow(
      'permission denied',
    )
  })
})

describe('listTournamentStages', () => {
  it('lista las etapas del torneo ordenadas por order_index', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        { id: 'stage-1', tournament_id: 'tournament-1', name: 'Apertura', order_index: 0 },
        { id: 'stage-2', tournament_id: 'tournament-1', name: 'Clausura', order_index: 1 },
      ],
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    const stages = await listTournamentStages('tournament-1')

    expect(eq).toHaveBeenCalledWith('tournament_id', 'tournament-1')
    expect(order).toHaveBeenCalledWith('order_index', { ascending: true })
    expect(stages).toEqual([
      { id: 'stage-1', tournamentId: 'tournament-1', name: 'Apertura', orderIndex: 0 },
      { id: 'stage-2', tournamentId: 'tournament-1', name: 'Clausura', orderIndex: 1 },
    ])
  })

  it('propaga el error cuando falla la consulta', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(listTournamentStages('tournament-1')).rejects.toThrow('permission denied')
  })
})

describe('renameStage', () => {
  it('actualiza el nombre de la etapa sin tocar los partidos asociados', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ update } as never)

    await renameStage('stage-1', 'Apertura 2026')

    expect(mockedFrom).toHaveBeenCalledWith('tournament_stages')
    expect(update).toHaveBeenCalledWith({ name: 'Apertura 2026' })
    expect(eq).toHaveBeenCalledWith('id', 'stage-1')
  })

  it('propaga el error cuando falla la actualizacion', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'permission denied' } })
    const update = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ update } as never)

    await expect(renameStage('stage-1', 'Apertura 2026')).rejects.toThrow('permission denied')
  })
})

describe('getCurrentStage', () => {
  it('devuelve la etapa marcada como is_current del torneo', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'stage-2', tournament_id: 'tournament-1', name: 'Intermedio', order_index: 1 },
      error: null,
    })
    const eq2 = vi.fn().mockReturnValue({ maybeSingle })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const select = vi.fn().mockReturnValue({ eq: eq1 })
    mockedFrom.mockReturnValue({ select } as never)

    const stage = await getCurrentStage('tournament-1')

    expect(mockedFrom).toHaveBeenCalledWith('tournament_stages')
    expect(eq1).toHaveBeenCalledWith('tournament_id', 'tournament-1')
    expect(eq2).toHaveBeenCalledWith('is_current', true)
    expect(stage).toEqual({ id: 'stage-2', tournamentId: 'tournament-1', name: 'Intermedio', orderIndex: 1 })
  })

  it('devuelve null cuando el torneo no tiene ninguna etapa marcada como actual', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq2 = vi.fn().mockReturnValue({ maybeSingle })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const select = vi.fn().mockReturnValue({ eq: eq1 })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(getCurrentStage('tournament-1')).resolves.toBeNull()
  })

  it('propaga el error cuando falla la consulta', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const eq2 = vi.fn().mockReturnValue({ maybeSingle })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const select = vi.fn().mockReturnValue({ eq: eq1 })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(getCurrentStage('tournament-1')).rejects.toThrow('permission denied')
  })
})

describe('isSuperadmin', () => {
  it('devuelve true cuando la RPC confirma que soy superadmin', async () => {
    mockedRpc.mockResolvedValue({ data: true, error: null } as never)

    const result = await isSuperadmin()

    expect(mockedRpc).toHaveBeenCalledWith('is_superadmin')
    expect(result).toBe(true)
  })

  it('devuelve false cuando la RPC confirma que no soy superadmin', async () => {
    mockedRpc.mockResolvedValue({ data: false, error: null } as never)

    await expect(isSuperadmin()).resolves.toBe(false)
  })
})
