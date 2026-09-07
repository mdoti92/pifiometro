import { supabase } from '../lib/supabase'

export type FixtureMatchStatus = 'scheduled' | 'finished' | 'postponed'

export interface FixtureMatch {
  id: string
  homeTeam: string
  awayTeam: string
  kickoffAt: string
  matchday: number | null
  status: FixtureMatchStatus
  homeGoals: number | null
  awayGoals: number | null
  isElimination: boolean
  wentToPenalties: boolean
  homeGoalsPenalties: number | null
  awayGoalsPenalties: number | null
}

interface FixtureMatchRow {
  id: string
  home_team: string
  away_team: string
  kickoff_at: string
  matchday: number | null
  status: FixtureMatchStatus
  home_goals: number | null
  away_goals: number | null
  is_elimination: boolean
  went_to_penalties: boolean
  home_goals_penalties: number | null
  away_goals_penalties: number | null
}

export async function listTournamentFixture(tournamentId: string): Promise<FixtureMatch[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      'id, home_team, away_team, kickoff_at, matchday, status, home_goals, away_goals, is_elimination, went_to_penalties, home_goals_penalties, away_goals_penalties',
    )
    .eq('tournament_id', tournamentId)
    .order('kickoff_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as FixtureMatchRow[]).map((row) => ({
    id: row.id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    kickoffAt: row.kickoff_at,
    matchday: row.matchday,
    status: row.status,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    isElimination: row.is_elimination,
    wentToPenalties: row.went_to_penalties,
    homeGoalsPenalties: row.home_goals_penalties,
    awayGoalsPenalties: row.away_goals_penalties,
  }))
}
