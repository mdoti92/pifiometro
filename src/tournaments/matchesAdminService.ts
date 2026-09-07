import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getTeamDisplayName } from '../teams/teamsService'

export interface Match {
  id: string
  tournamentId: string
  stageId: string | null
  homeTeamId: string
  awayTeamId: string
  homeTeam: string
  awayTeam: string
  homeTeamSlug: string
  awayTeamSlug: string
  kickoffAt: string
  isElimination: boolean
  source: 'api' | 'manual'
  matchday?: number | null
  homeGoals?: number | null
  awayGoals?: number | null
  status?: 'scheduled' | 'finished' | 'postponed'
  wentToPenalties?: boolean
  homeGoalsPenalties?: number | null
  awayGoalsPenalties?: number | null
}

export interface NewMatchInput {
  tournamentId: string
  stageId: string | null
  homeTeamId: string
  awayTeamId: string
  kickoffAt: string
  isElimination: boolean
  matchday?: number | null
}

export interface EditMatchInput {
  stageId?: string | null
  homeTeamId?: string
  awayTeamId?: string
  kickoffAt?: string
  isElimination?: boolean
  matchday?: number | null
  homeGoals?: number
  awayGoals?: number
  status?: 'scheduled' | 'finished' | 'postponed'
  wentToPenalties?: boolean
  homeGoalsPenalties?: number
  awayGoalsPenalties?: number
}

async function unwrap<T>(result: { data: T | null; error: Error | null }): Promise<T> {
  if (result.error) {
    if (result.error instanceof FunctionsHttpError) {
      const response = result.error.context as Response
      const body = await response.json().catch(() => null)
      throw new Error(body?.error ?? result.error.message)
    }
    throw new Error(result.error.message)
  }

  return result.data as T
}

export async function createMatch(input: NewMatchInput): Promise<Match> {
  return unwrap(
    await supabase.functions.invoke('matches-admin', {
      method: 'POST',
      body: input,
    }),
  )
}

export async function editMatch(matchId: string, input: EditMatchInput): Promise<Match> {
  return unwrap(
    await supabase.functions.invoke(`matches-admin/${matchId}`, {
      method: 'PATCH',
      body: input,
    }),
  )
}

interface MatchAdminTeamRow {
  name: string
  alias: string | null
  slug: string
}

export async function listMatches(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      'id, tournament_id, stage_id, home_team_id, away_team_id, kickoff_at, is_elimination, source, matchday, home_goals, away_goals, status, went_to_penalties, home_goals_penalties, away_goals_penalties, home:teams!home_team_id(name, alias, slug), away:teams!away_team_id(name, alias, slug)',
    )
    .eq('tournament_id', tournamentId)
    .order('kickoff_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (
    data as unknown as (Record<string, unknown> & {
      home: MatchAdminTeamRow | null
      away: MatchAdminTeamRow | null
    })[]
  ).map((row) => ({
    id: row.id as string,
    tournamentId: row.tournament_id as string,
    stageId: row.stage_id as string | null,
    homeTeamId: row.home_team_id as string,
    awayTeamId: row.away_team_id as string,
    homeTeam: getTeamDisplayName(row.home),
    awayTeam: getTeamDisplayName(row.away),
    homeTeamSlug: row.home?.slug ?? '',
    awayTeamSlug: row.away?.slug ?? '',
    kickoffAt: row.kickoff_at as string,
    isElimination: row.is_elimination as boolean,
    source: row.source as 'api' | 'manual',
    matchday: row.matchday as number | null,
    homeGoals: row.home_goals as number | null,
    awayGoals: row.away_goals as number | null,
    status: row.status as Match['status'],
    wentToPenalties: row.went_to_penalties as boolean,
    homeGoalsPenalties: row.home_goals_penalties as number | null,
    awayGoalsPenalties: row.away_goals_penalties as number | null,
  }))
}
