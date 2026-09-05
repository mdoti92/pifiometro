import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMatch,
  editMatch,
  MatchNotFoundError,
  type MatchesAdminClient,
  NotSuperadminError,
} from './matchesAdmin'

function createFakeClient(overrides: Partial<MatchesAdminClient> = {}): MatchesAdminClient {
  return {
    isSuperadmin: vi.fn().mockResolvedValue(true),
    insertMatch: vi.fn(),
    updateMatch: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createMatch', () => {
  const input = {
    tournamentId: 'tournament-1',
    stageId: 'stage-1',
    homeTeam: 'Nacional',
    awayTeam: 'Peñarol',
    kickoffAt: '2026-03-01T20:00:00Z',
    isElimination: false,
    matchday: 3,
  }

  it('lanza NotSuperadminError sin insertar cuando el usuario no es superadmin', async () => {
    const client = createFakeClient({ isSuperadmin: vi.fn().mockResolvedValue(false) })

    await expect(createMatch(client, 'user-1', input)).rejects.toThrow(NotSuperadminError)
    expect(client.insertMatch).not.toHaveBeenCalled()
  })

  it('inserta el partido marcado con source=manual cuando el usuario es superadmin', async () => {
    const insertedMatch = { id: 'match-1', ...input, source: 'manual' as const }
    const client = createFakeClient({ insertMatch: vi.fn().mockResolvedValue(insertedMatch) })

    const result = await createMatch(client, 'user-1', input)

    expect(client.insertMatch).toHaveBeenCalledWith({ ...input, source: 'manual' })
    expect(result).toEqual(insertedMatch)
  })
})

describe('editMatch', () => {
  const changes = { kickoffAt: '2026-03-02T21:00:00Z' }

  it('lanza NotSuperadminError sin actualizar cuando el usuario no es superadmin', async () => {
    const client = createFakeClient({ isSuperadmin: vi.fn().mockResolvedValue(false) })

    await expect(editMatch(client, 'user-1', 'match-1', changes)).rejects.toThrow(
      NotSuperadminError,
    )
    expect(client.updateMatch).not.toHaveBeenCalled()
  })

  it('lanza MatchNotFoundError cuando el partido no existe', async () => {
    const client = createFakeClient({ updateMatch: vi.fn().mockResolvedValue(null) })

    await expect(editMatch(client, 'user-1', 'match-inexistente', changes)).rejects.toThrow(
      MatchNotFoundError,
    )
  })

  it('actualiza el partido y lo marca como source=manual, incluso si antes era source=api', async () => {
    const updatedMatch = {
      id: 'match-1',
      tournamentId: 'tournament-1',
      stageId: 'stage-1',
      homeTeam: 'Nacional',
      awayTeam: 'Peñarol',
      kickoffAt: '2026-03-02T21:00:00Z',
      isElimination: false,
      source: 'manual' as const,
    }
    const client = createFakeClient({ updateMatch: vi.fn().mockResolvedValue(updatedMatch) })

    const result = await editMatch(client, 'user-1', 'match-1', changes)

    expect(client.updateMatch).toHaveBeenCalledWith('match-1', { ...changes, source: 'manual' })
    expect(result.source).toBe('manual')
  })

  it('carga un resultado marcando el partido como finished, source=manual', async () => {
    const resultInput = { homeGoals: 2, awayGoals: 1, status: 'finished' as const }
    const updatedMatch = {
      id: 'match-1',
      tournamentId: 'tournament-1',
      stageId: 'stage-1',
      homeTeam: 'Nacional',
      awayTeam: 'Peñarol',
      kickoffAt: '2026-03-01T20:00:00Z',
      isElimination: false,
      source: 'manual' as const,
      homeGoals: 2,
      awayGoals: 1,
      status: 'finished' as const,
    }
    const client = createFakeClient({ updateMatch: vi.fn().mockResolvedValue(updatedMatch) })

    const result = await editMatch(client, 'user-1', 'match-1', resultInput)

    expect(client.updateMatch).toHaveBeenCalledWith('match-1', { ...resultInput, source: 'manual' })
    expect(result.status).toBe('finished')
  })

  it('carga un resultado de partido eliminatorio definido por penales sin que afecten los goles reglamentarios', async () => {
    const resultInput = {
      homeGoals: 1,
      awayGoals: 1,
      status: 'finished' as const,
      wentToPenalties: true,
      homeGoalsPenalties: 5,
      awayGoalsPenalties: 4,
    }
    const updatedMatch = {
      id: 'match-1',
      tournamentId: 'tournament-1',
      stageId: 'stage-1',
      homeTeam: 'Nacional',
      awayTeam: 'Peñarol',
      kickoffAt: '2026-03-01T20:00:00Z',
      isElimination: true,
      source: 'manual' as const,
      homeGoals: 1,
      awayGoals: 1,
      status: 'finished' as const,
      wentToPenalties: true,
      homeGoalsPenalties: 5,
      awayGoalsPenalties: 4,
    }
    const client = createFakeClient({ updateMatch: vi.fn().mockResolvedValue(updatedMatch) })

    const result = await editMatch(client, 'user-1', 'match-1', resultInput)

    expect(client.updateMatch).toHaveBeenCalledWith('match-1', { ...resultInput, source: 'manual' })
    expect(result.homeGoals).toBe(1)
    expect(result.awayGoals).toBe(1)
    expect(result.homeGoalsPenalties).toBe(5)
  })
})
