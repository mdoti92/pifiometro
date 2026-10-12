import { supabase } from '../lib/supabase'
import { getTeamDisplayName } from '../teams/teamsService'

export type FixtureMatchStatus = 'scheduled' | 'finished' | 'postponed'

export interface FixtureMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamSlug: string
  awayTeamSlug: string
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

interface FixtureTeamRow {
  name: string
  alias: string | null
  slug: string
}

interface FixtureMatchRow {
  id: string
  kickoff_at: string
  matchday: number | null
  status: FixtureMatchStatus
  home_goals: number | null
  away_goals: number | null
  is_elimination: boolean
  went_to_penalties: boolean
  home_goals_penalties: number | null
  away_goals_penalties: number | null
  home: FixtureTeamRow | null
  away: FixtureTeamRow | null
}

export async function listTournamentFixture(tournamentId: string): Promise<FixtureMatch[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      'id, kickoff_at, matchday, status, home_goals, away_goals, is_elimination, went_to_penalties, home_goals_penalties, away_goals_penalties, home:teams!home_team_id(name, alias, slug), away:teams!away_team_id(name, alias, slug)',
    )
    .eq('tournament_id', tournamentId)
    .order('kickoff_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as FixtureMatchRow[]).map((row) => ({
    id: row.id,
    homeTeam: getTeamDisplayName(row.home),
    awayTeam: getTeamDisplayName(row.away),
    homeTeamSlug: row.home?.slug ?? '',
    awayTeamSlug: row.away?.slug ?? '',
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
