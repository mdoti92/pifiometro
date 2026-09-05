import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

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

export async function listMatches(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('id, tournament_id, stage_id, home_team, away_team, kickoff_at, is_elimination, source')
    .eq('tournament_id', tournamentId)
    .order('kickoff_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data.map((row) => ({
    id: row.id,
    tournamentId: row.tournament_id,
    stageId: row.stage_id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    kickoffAt: row.kickoff_at,
    isElimination: row.is_elimination,
    source: row.source,
  }))
}
