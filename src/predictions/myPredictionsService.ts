import { supabase } from '../lib/supabase'
import { getTeamDisplayName } from '../teams/teamsService'
import { hasKickedOff } from './predictionsService'

export type MatchPredictionStatusValue = 'pendiente' | 'cargado' | 'no_pronosticado'

export interface MatchPredictionStatus {
  matchId: string
  homeTeam: string
  awayTeam: string
  homeTeamSlug: string
  awayTeamSlug: string
  kickoffAt: string
  status: MatchPredictionStatusValue
  homeGoals: number | null
  awayGoals: number | null
}

interface MatchTeamRow {
  name: string
  alias: string | null
  slug: string
}

interface MatchRow {
  id: string
  kickoff_at: string
  home: MatchTeamRow | null
  away: MatchTeamRow | null
}

export async function listMatchPredictionStatuses(
  stageId: string,
  groupId: string,
  userId: string,
): Promise<MatchPredictionStatus[]> {
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, kickoff_at, home:teams!home_team_id(name, alias, slug), away:teams!away_team_id(name, alias, slug)')
    .eq('stage_id', stageId)
    .order('kickoff_at', { ascending: true })

  if (matchesError) {
    throw new Error(matchesError.message)
  }

  if (matches.length === 0) {
    return []
  }

  const matchRows = matches as unknown as MatchRow[]
  const matchIds = matchRows.map((match) => match.id)

  const { data: predictions, error: predictionsError } = await supabase
    .from('predictions')
    .select('match_id, home_goals, away_goals')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .in('match_id', matchIds)

  if (predictionsError) {
    throw new Error(predictionsError.message)
  }

  const predictionByMatchId = new Map(predictions.map((prediction) => [prediction.match_id, prediction]))

  return matchRows.map((match) => {
    const prediction = predictionByMatchId.get(match.id)
    const homeTeam = getTeamDisplayName(match.home)
    const awayTeam = getTeamDisplayName(match.away)
    const homeTeamSlug = match.home?.slug ?? ''
    const awayTeamSlug = match.away?.slug ?? ''

    if (prediction) {
      return {
        matchId: match.id,
        homeTeam,
        awayTeam,
        homeTeamSlug,
        awayTeamSlug,
        kickoffAt: match.kickoff_at,
        status: 'cargado' as const,
        homeGoals: prediction.home_goals,
        awayGoals: prediction.away_goals,
      }
    }

    return {
      matchId: match.id,
      homeTeam,
      awayTeam,
      homeTeamSlug,
      awayTeamSlug,
      kickoffAt: match.kickoff_at,
      status: hasKickedOff(match.kickoff_at) ? ('no_pronosticado' as const) : ('pendiente' as const),
      homeGoals: null,
      awayGoals: null,
    }
  })
}
