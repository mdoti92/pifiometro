import { supabase } from '../lib/supabase'

export interface Prediction {
  homeGoals: number
  awayGoals: number
}

export interface MatchInfo {
  id: string
  homeTeam: string
  awayTeam: string
  kickoffAt: string
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
    .select('id, home_team, away_team, kickoff_at')
    .eq('id', matchId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    homeTeam: data.home_team,
    awayTeam: data.away_team,
    kickoffAt: data.kickoff_at,
  }
}

export function hasKickedOff(kickoffAt: string): boolean {
  return new Date(kickoffAt).getTime() <= Date.now()
}
