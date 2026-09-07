import { supabase } from '../lib/supabase'
import { getTeamDisplayName } from '../teams/teamsService'

export interface Prediction {
  homeGoals: number
  awayGoals: number
}

export interface MatchInfo {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamSlug: string
  awayTeamSlug: string
  kickoffAt: string
}

interface MatchInfoTeamRow {
  name: string
  alias: string | null
  slug: string
}

export interface SavePredictionInput {
  matchId: string
  groupId: string
  userId: string
  homeGoals: number
  awayGoals: number
}

export class InvalidGoalsError extends Error {
  constructor() {
    super('Los goles deben ser un número entero mayor o igual a 0')
    this.name = 'InvalidGoalsError'
  }
}

function isValidGoals(value: number): boolean {
  return Number.isInteger(value) && value >= 0
}

export async function getPrediction(
  matchId: string,
  groupId: string,
  userId: string,
): Promise<Prediction | null> {
  const { data, error } = await supabase
    .from('predictions')
    .select('home_goals, away_goals')
    .eq('match_id', matchId)
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? { homeGoals: data.home_goals, awayGoals: data.away_goals } : null
}

export async function savePrediction(input: SavePredictionInput): Promise<void> {
  if (!isValidGoals(input.homeGoals) || !isValidGoals(input.awayGoals)) {
    throw new InvalidGoalsError()
  }

  const { error } = await supabase.from('predictions').upsert(
    {
      match_id: input.matchId,
      group_id: input.groupId,
      user_id: input.userId,
      home_goals: input.homeGoals,
      away_goals: input.awayGoals,
    },
    { onConflict: 'match_id,group_id,user_id' },
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function getMatch(matchId: string): Promise<MatchInfo> {
  const { data, error } = await supabase
    .from('matches')
    .select('id, kickoff_at, home:teams!home_team_id(name, alias, slug), away:teams!away_team_id(name, alias, slug)')
    .eq('id', matchId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const home = data.home as unknown as MatchInfoTeamRow | null
  const away = data.away as unknown as MatchInfoTeamRow | null

  return {
    id: data.id,
    homeTeam: getTeamDisplayName(home),
    awayTeam: getTeamDisplayName(away),
    homeTeamSlug: home?.slug ?? '',
    awayTeamSlug: away?.slug ?? '',
    kickoffAt: data.kickoff_at,
  }
}

export function hasKickedOff(kickoffAt: string): boolean {
  return new Date(kickoffAt).getTime() <= Date.now()
}
