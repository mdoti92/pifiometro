import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TenfieldMatch } from './parseFechasWidget'
import { type SyncMatchesClient, syncTenfieldMatches } from './syncTenfieldMatches'

const STAGE_ID = 'stage-clausura'

function tenfieldMatch(overrides: Partial<TenfieldMatch> = {}): TenfieldMatch {
  return {
    homeTeamName: 'Liverpool',
    awayTeamName: 'Progreso',
    kickoffAt: '2026-10-03T14:00:00',
    homeGoals: 3,
    awayGoals: 2,
    status: 'finished',
    ...overrides,
  }
}

function createFakeClient(overrides: Partial<SyncMatchesClient> = {}): SyncMatchesClient {
  return {
    resolveTeamId: vi.fn().mockImplementation((slug: string) => Promise.resolve(`team-${slug}`)),
    findMatch: vi.fn().mockResolvedValue({ id: 'match-1' }),
    updateMatch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('syncTenfieldMatches', () => {
  it('un partido ya jugado actualiza kickoff, goles y status finished', async () => {
    const client = createFakeClient()

    const result = await syncTenfieldMatches(client, STAGE_ID, [tenfieldMatch()])

    expect(client.findMatch).toHaveBeenCalledWith(STAGE_ID, 'team-liverpool', 'team-progreso')
    expect(client.updateMatch).toHaveBeenCalledWith('match-1', {
      kickoffAt: '2026-10-03T14:00:00',
      homeGoals: 3,
      awayGoals: 2,
      status: 'finished',
    })
    expect(result).toEqual({ updated: 1, skippedUnmappedTeam: [], skippedNotFound: 0 })
  })

  it('un partido sin jugar solo actualiza kickoff, sin tocar goles ni status', async () => {
    const client = createFakeClient()
    const match = tenfieldMatch({ homeGoals: null, awayGoals: null, status: 'scheduled' })

    await syncTenfieldMatches(client, STAGE_ID, [match])

    expect(client.updateMatch).toHaveBeenCalledWith('match-1', {
      kickoffAt: '2026-10-03T14:00:00',
    })
  })

  it('omite el partido y lo cuenta cuando un nombre de equipo no tiene mapeo conocido', async () => {
    const client = createFakeClient()
    const match = tenfieldMatch({ homeTeamName: 'Club Inexistente' })

    const result = await syncTenfieldMatches(client, STAGE_ID, [match])

    expect(client.findMatch).not.toHaveBeenCalled()
    expect(client.updateMatch).not.toHaveBeenCalled()
    expect(result).toEqual({
      updated: 0,
      skippedUnmappedTeam: ['Club Inexistente'],
      skippedNotFound: 0,
    })
  })

  it('omite el partido y sigue con el resto cuando no existe en matches para ese stage+equipos', async () => {
    const client = createFakeClient({ findMatch: vi.fn().mockResolvedValue(null) })

    const result = await syncTenfieldMatches(client, STAGE_ID, [tenfieldMatch()])

    expect(client.updateMatch).not.toHaveBeenCalled()
    expect(result).toEqual({ updated: 0, skippedUnmappedTeam: [], skippedNotFound: 1 })
  })

  it('sigue procesando el resto de los partidos si uno falla por equipo no mapeado', async () => {
    const client = createFakeClient()
    const matches = [
      tenfieldMatch({ homeTeamName: 'Club Inexistente' }),
      tenfieldMatch({ homeTeamName: 'Cerro', awayTeamName: 'Danubio' }),
    ]

    const result = await syncTenfieldMatches(client, STAGE_ID, matches)

    expect(client.updateMatch).toHaveBeenCalledTimes(1)
    expect(result.updated).toBe(1)
    expect(result.skippedUnmappedTeam).toEqual(['Club Inexistente'])
  })

  it('es idempotente: correrlo dos veces seguidas sobre el mismo partido produce el mismo resultado final', async () => {
    const client = createFakeClient()

    const firstRun = await syncTenfieldMatches(client, STAGE_ID, [tenfieldMatch()])
    const secondRun = await syncTenfieldMatches(client, STAGE_ID, [tenfieldMatch()])

    expect(firstRun).toEqual(secondRun)
    expect(client.updateMatch).toHaveBeenNthCalledWith(1, 'match-1', {
      kickoffAt: '2026-10-03T14:00:00',
      homeGoals: 3,
      awayGoals: 2,
      status: 'finished',
    })
    expect(client.updateMatch).toHaveBeenNthCalledWith(2, 'match-1', {
      kickoffAt: '2026-10-03T14:00:00',
      homeGoals: 3,
      awayGoals: 2,
      status: 'finished',
    })
  })
})
