import { supabase } from '../lib/supabase'
import { getTeamDisplayName } from '../teams/teamsService'

export type HistoryStatus = 'exacto' | 'resultado' | 'pifiado' | 'no_pronosticado' | 'por_definir'

export interface MatchHistoryRow {
  matchId: string
  homeTeam: string
  awayTeam: string
  homeTeamSlug: string
  awayTeamSlug: string
  kickoffAt: string
  predictedHomeGoals: number | null
  predictedAwayGoals: number | null
  actualHomeGoals: number | null
  actualAwayGoals: number | null
  status: HistoryStatus
}

interface HistoryTeamRow {
  name: string
  alias: string | null
  slug: string
}

interface HistoryMatchRow {
  id: string
  kickoff_at: string
  home_goals: number
  away_goals: number
  status: string
  home: HistoryTeamRow | null
  away: HistoryTeamRow | null
}

interface PredictionStatusRow {
  match_id: string
  home_goals: number
  away_goals: number
  status: HistoryStatus
}

export async function getMatchHistory(
  tournamentId: string,
  groupId: string,
  userId: string,
): Promise<MatchHistoryRow[]> {
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select(
      'id, kickoff_at, home_goals, away_goals, status, home:teams!home_team_id(name, alias, slug), away:teams!away_team_id(name, alias, slug)',
    )
    .eq('tournament_id', tournamentId)
    .order('kickoff_at', { ascending: true })

  if (matchesError) {
    throw new Error(matchesError.message)
  }

  if (matches.length === 0) {
    return []
  }

  const matchRows = matches as unknown as HistoryMatchRow[]
  const matchIds = matchRows.map((match) => match.id)

  const { data: predictions, error: predictionsError } = await supabase
    .from('predictions')
    .select('match_id, home_goals, away_goals, status')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .in('match_id', matchIds)

  if (predictionsError) {
    throw new Error(predictionsError.message)
  }

  const predictionByMatchId = new Map(
    (predictions as PredictionStatusRow[]).map((prediction) => [prediction.match_id, prediction]),
  )

  return matchRows.map((match) => {
    const prediction = predictionByMatchId.get(match.id)
    const finished = match.status === 'finished'

    return {
      matchId: match.id,
      homeTeam: getTeamDisplayName(match.home),
      awayTeam: getTeamDisplayName(match.away),
      homeTeamSlug: match.home?.slug ?? '',
      awayTeamSlug: match.away?.slug ?? '',
      kickoffAt: match.kickoff_at,
      predictedHomeGoals: prediction?.home_goals ?? null,
      predictedAwayGoals: prediction?.away_goals ?? null,
      actualHomeGoals: match.home_goals,
      actualAwayGoals: match.away_goals,
      status: prediction ? prediction.status : finished ? 'no_pronosticado' : 'por_definir',
    }
  })
}
