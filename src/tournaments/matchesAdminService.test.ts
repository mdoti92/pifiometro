import { FunctionsHttpError } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { createMatch, editMatch, listMatches } from './matchesAdminService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(),
  },
}))

const mockedInvoke = vi.mocked(supabase.functions.invoke)
const mockedFrom = vi.mocked(supabase.from)

const newMatchInput = {
  tournamentId: 'tournament-1',
  stageId: 'stage-1',
  homeTeam: 'Nacional',
  awayTeam: 'Peñarol',
  kickoffAt: '2026-03-01T20:00:00Z',
  isElimination: false,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createMatch', () => {
  it('invoca la edge function matches-admin con POST y devuelve el partido creado', async () => {
    const created = { id: 'match-1', ...newMatchInput, source: 'manual' }
    mockedInvoke.mockResolvedValue({ data: created, error: null } as never)

    const result = await createMatch(newMatchInput)

    expect(mockedInvoke).toHaveBeenCalledWith('matches-admin', {
      method: 'POST',
      body: newMatchInput,
    })
    expect(result).toEqual(created)
  })

  it('propaga el mensaje de error que devuelve la funcion cuando no soy superadmin', async () => {
    const fakeResponse = {
      json: () => Promise.resolve({ error: 'Solo un superadmin puede cargar o editar partidos' }),
    }
    mockedInvoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(fakeResponse),
    } as never)

    await expect(createMatch(newMatchInput)).rejects.toThrow(
      'Solo un superadmin puede cargar o editar partidos',
    )
  })
})

describe('editMatch', () => {
  const changes = { kickoffAt: '2026-03-02T21:00:00Z' }

  it('invoca la edge function matches-admin/:id con PATCH y devuelve el partido actualizado', async () => {
    const updated = { id: 'match-1', ...newMatchInput, ...changes, source: 'manual' }
    mockedInvoke.mockResolvedValue({ data: updated, error: null } as never)

    const result = await editMatch('match-1', changes)

    expect(mockedInvoke).toHaveBeenCalledWith('matches-admin/match-1', {
      method: 'PATCH',
      body: changes,
    })
    expect(result).toEqual(updated)
  })

  it('propaga el mensaje de error cuando el partido no existe', async () => {
    const fakeResponse = { json: () => Promise.resolve({ error: 'El partido no existe' }) }
    mockedInvoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(fakeResponse),
    } as never)

    await expect(editMatch('match-inexistente', changes)).rejects.toThrow('El partido no existe')
  })
})

describe('listMatches', () => {
  it('lista los partidos del torneo ordenados por fecha de kickoff', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'match-1',
          tournament_id: 'tournament-1',
          stage_id: 'stage-1',
          home_team: 'Nacional',
          away_team: 'Peñarol',
          kickoff_at: '2026-03-01T20:00:00Z',
          is_elimination: false,
          source: 'manual',
        },
      ],
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    const matches = await listMatches('tournament-1')

    expect(mockedFrom).toHaveBeenCalledWith('matches')
    expect(eq).toHaveBeenCalledWith('tournament_id', 'tournament-1')
    expect(order).toHaveBeenCalledWith('kickoff_at', { ascending: true })
    expect(matches).toEqual([
      {
        id: 'match-1',
        tournamentId: 'tournament-1',
        stageId: 'stage-1',
        homeTeam: 'Nacional',
        awayTeam: 'Peñarol',
        kickoffAt: '2026-03-01T20:00:00Z',
        isElimination: false,
        source: 'manual',
      },
    ])
  })

  it('propaga el error cuando falla la consulta', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockedFrom.mockReturnValue({ select } as never)

    await expect(listMatches('tournament-1')).rejects.toThrow('permission denied')
  })
})
