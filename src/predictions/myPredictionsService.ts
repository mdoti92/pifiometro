import { supabase } from '../lib/supabase'
import { getTeamDisplayName } from '../teams/teamsService'

export type MatchPredictionStatusValue = 'pendiente' | 'cargado' | 'no_pronosticado'
export type MatchStatusValue = 'scheduled' | 'finished' | 'postponed'
export type PredictionOutcome = 'exacto' | 'resultado' | 'pifiado'

export interface MatchPredictionStatus {
  matchId: string
  homeTeam: string
  awayTeam: string
  homeTeamSlug: string
  awayTeamSlug: string
  kickoffAt: string
  matchday: number | null
  matchStatus: MatchStatusValue
  status: MatchPredictionStatusValue
  homeGoals: number | null
  awayGoals: number | null
  actualHomeGoals: number | null
  actualAwayGoals: number | null
  outcome: PredictionOutcome | null
}

interface MatchTeamRow {
  name: string
  alias: string | null
  slug: string
}

interface MatchRow {
  id: string
  kickoff_at: string
  matchday: number | null
  status: MatchStatusValue
  home_goals?: number | null
  away_goals?: number | null
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
    .select(
      'id, kickoff_at, matchday, status, home_goals, away_goals, home:teams!home_team_id(name, alias, slug), away:teams!away_team_id(name, alias, slug)',
    )
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
    .select('match_id, home_goals, away_goals, status')
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
    const finished = match.status === 'finished'
    const actualHomeGoals = finished ? (match.home_goals ?? null) : null
    const actualAwayGoals = finished ? (match.away_goals ?? null) : null

    if (prediction) {
      return {
        matchId: match.id,
        homeTeam,
        awayTeam,
        homeTeamSlug,
        awayTeamSlug,
        kickoffAt: match.kickoff_at,
        matchday: match.matchday,
        matchStatus: match.status,
        status: 'cargado' as const,
        homeGoals: prediction.home_goals,
        awayGoals: prediction.away_goals,
        actualHomeGoals,
        actualAwayGoals,
        outcome: finished ? toOutcome(prediction.status) : null,
      }
    }

    return {
      matchId: match.id,
      homeTeam,
      awayTeam,
      homeTeamSlug,
      awayTeamSlug,
      kickoffAt: match.kickoff_at,
      matchday: match.matchday,
      matchStatus: match.status,
      status: finished ? ('no_pronosticado' as const) : ('pendiente' as const),
      homeGoals: null,
      awayGoals: null,
      actualHomeGoals,
      actualAwayGoals,
      outcome: null,
    }
  })
}

const OUTCOMES: readonly string[] = ['exacto', 'resultado', 'pifiado'] satisfies PredictionOutcome[]

function toOutcome(status: string | null | undefined): PredictionOutcome | null {
  return status && OUTCOMES.includes(status) ? (status as PredictionOutcome) : null
}
