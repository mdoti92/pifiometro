import { supabase } from '../lib/supabase'
import { hasKickedOff } from './predictionsService'

export type MatchPredictionStatusValue = 'pendiente' | 'cargado' | 'no_pronosticado'

export interface MatchPredictionStatus {
  matchId: string
  homeTeam: string
  awayTeam: string
  kickoffAt: string
  status: MatchPredictionStatusValue
  homeGoals: number | null
  awayGoals: number | null
}

export async function listMatchPredictionStatuses(
  stageId: string,
  groupId: string,
  userId: string,
): Promise<MatchPredictionStatus[]> {
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, home_team, away_team, kickoff_at')
    .eq('stage_id', stageId)
    .order('kickoff_at', { ascending: true })

  if (matchesError) {
    throw new Error(matchesError.message)
  }

  if (matches.length === 0) {
    return []
  }

  const matchIds = matches.map((match) => match.id)

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

  return matches.map((match) => {
    const prediction = predictionByMatchId.get(match.id)

    if (prediction) {
      return {
        matchId: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        kickoffAt: match.kickoff_at,
        status: 'cargado' as const,
        homeGoals: prediction.home_goals,
        awayGoals: prediction.away_goals,
      }
    }

    return {
      matchId: match.id,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      kickoffAt: match.kickoff_at,
      status: hasKickedOff(match.kickoff_at) ? ('no_pronosticado' as const) : ('pendiente' as const),
      homeGoals: null,
      awayGoals: null,
    }
  })
}
