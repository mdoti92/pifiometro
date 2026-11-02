import type { TenfieldMatch } from './parseFechasWidget.ts'
import { resolveTeamSlug } from './teamNameMapping.ts'

export interface MatchUpdate {
  kickoffAt: string
  kickoffConfirmed?: true
  homeGoals?: number
  awayGoals?: number
  status?: 'finished'
}

export interface SyncMatchesClient {
  resolveTeamId(slug: string): Promise<string | null>
  findMatch(stageId: string, homeTeamId: string, awayTeamId: string): Promise<{ id: string } | null>
  updateMatch(matchId: string, data: MatchUpdate): Promise<void>
}

export interface SyncResult {
  updated: number
  skippedUnmappedTeam: string[]
  skippedNotFound: number
}

function toMatchUpdate(match: TenfieldMatch, now: Date): MatchUpdate {
  if (match.status === 'finished' && match.homeGoals !== null && match.awayGoals !== null) {
    return {
      kickoffAt: match.kickoffAt,
      kickoffConfirmed: true,
      homeGoals: match.homeGoals,
      awayGoals: match.awayGoals,
      status: 'finished',
    }
  }
  // Un horario futuro publicado por tenfield es real. Uno ya pasado sin resultado puede ser un
  // partido en juego o un relleno vencido: no se distingue, asi que no se toca la confirmacion.
  if (new Date(match.kickoffAt).getTime() > now.getTime()) {
    return { kickoffAt: match.kickoffAt, kickoffConfirmed: true }
  }
  return { kickoffAt: match.kickoffAt }
}

export async function syncTenfieldMatches(
  client: SyncMatchesClient,
  stageId: string,
  matches: TenfieldMatch[],
  now: Date = new Date(),
): Promise<SyncResult> {
  const result: SyncResult = { updated: 0, skippedUnmappedTeam: [], skippedNotFound: 0 }

  for (const match of matches) {
    const homeSlug = resolveTeamSlug(match.homeTeamName)
    const awaySlug = resolveTeamSlug(match.awayTeamName)

    if (!homeSlug) {
      result.skippedUnmappedTeam.push(match.homeTeamName)
      continue
    }
    if (!awaySlug) {
      result.skippedUnmappedTeam.push(match.awayTeamName)
      continue
    }

    const homeTeamId = await client.resolveTeamId(homeSlug)
    const awayTeamId = await client.resolveTeamId(awaySlug)
    if (!homeTeamId || !awayTeamId) {
      result.skippedUnmappedTeam.push(!homeTeamId ? match.homeTeamName : match.awayTeamName)
      continue
    }

    const existingMatch = await client.findMatch(stageId, homeTeamId, awayTeamId)
    if (!existingMatch) {
      result.skippedNotFound += 1
      continue
    }

    await client.updateMatch(existingMatch.id, toMatchUpdate(match, now))
    result.updated += 1
  }

  return result
}
