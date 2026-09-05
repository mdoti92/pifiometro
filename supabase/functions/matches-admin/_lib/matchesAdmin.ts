export interface Match {
  id: string
  tournamentId: string
  stageId: string | null
  homeTeam: string
  awayTeam: string
  kickoffAt: string
  isElimination: boolean
  source: 'api' | 'manual'
}

export interface NewMatchInput {
  tournamentId: string
  stageId: string | null
  homeTeam: string
  awayTeam: string
  kickoffAt: string
  isElimination: boolean
}

export interface EditMatchInput {
  stageId?: string | null
  homeTeam?: string
  awayTeam?: string
  kickoffAt?: string
  isElimination?: boolean
}

export interface MatchesAdminClient {
  isSuperadmin(userId: string): Promise<boolean>
  insertMatch(data: NewMatchInput & { source: 'manual' }): Promise<Match>
  updateMatch(matchId: string, data: EditMatchInput & { source: 'manual' }): Promise<Match | null>
}

export class NotSuperadminError extends Error {
  constructor() {
    super('Solo un superadmin puede cargar o editar partidos')
    this.name = 'NotSuperadminError'
  }
}

export class MatchNotFoundError extends Error {
  constructor() {
    super('El partido no existe')
    this.name = 'MatchNotFoundError'
  }
}

export async function createMatch(
  client: MatchesAdminClient,
  userId: string,
  input: NewMatchInput,
): Promise<Match> {
  if (!(await client.isSuperadmin(userId))) {
    throw new NotSuperadminError()
  }

  return client.insertMatch({ ...input, source: 'manual' })
}

export async function editMatch(
  client: MatchesAdminClient,
  userId: string,
  matchId: string,
  input: EditMatchInput,
): Promise<Match> {
  if (!(await client.isSuperadmin(userId))) {
    throw new NotSuperadminError()
  }

  const updated = await client.updateMatch(matchId, { ...input, source: 'manual' })

  if (!updated) {
    throw new MatchNotFoundError()
  }

  return updated
}
