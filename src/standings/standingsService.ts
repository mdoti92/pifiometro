import { listMembers } from '../groups/groupMembersService'
import { supabase } from '../lib/supabase'

export interface StandingRow {
  userId: string
  displayName: string | null
  totalPoints: number
  rank: number
}

interface PredictionPointsRow {
  user_id: string
  points: number
}

export async function getGroupTournamentStandings(
  groupId: string,
  tournamentId: string,
): Promise<StandingRow[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, points, matches!inner(tournament_id)')
    .eq('group_id', groupId)
    .eq('matches.tournament_id', tournamentId)

  if (error) {
    throw new Error(error.message)
  }

  return buildStandings(groupId, data as unknown as PredictionPointsRow[])
}

export async function getGroupStageStandings(
  groupId: string,
  stageId: string,
): Promise<StandingRow[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, points, matches!inner(stage_id)')
    .eq('group_id', groupId)
    .eq('matches.stage_id', stageId)

  if (error) {
    throw new Error(error.message)
  }

  return buildStandings(groupId, data as unknown as PredictionPointsRow[])
}

export interface MatchdaySummary {
  userId: string
  displayName: string | null
  bestMatchday: { matchday: number; points: number } | null
  matchdaysWon: number
}

interface PredictionMatchdayRow {
  user_id: string
  points: number
  matches: { matchday: number | null } | null
}

export async function getMatchdaySummaries(
  groupId: string,
  tournamentId: string,
): Promise<MatchdaySummary[]> {
  const members = await listMembers(groupId)

  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, points, matches!inner(matchday)')
    .eq('group_id', groupId)
    .eq('matches.tournament_id', tournamentId)
    .not('matches.matchday', 'is', null)

  if (error) {
    throw new Error(error.message)
  }

  const rows = data as unknown as PredictionMatchdayRow[]

  const pointsByUserAndMatchday = new Map<string, Map<number, number>>()
  const matchdays = new Set<number>()

  for (const row of rows) {
    const matchday = row.matches?.matchday
    if (matchday == null) continue

    matchdays.add(matchday)
    const userMatchdays = pointsByUserAndMatchday.get(row.user_id) ?? new Map<number, number>()
    userMatchdays.set(matchday, (userMatchdays.get(matchday) ?? 0) + row.points)
    pointsByUserAndMatchday.set(row.user_id, userMatchdays)
  }

  const matchdaysWonByUser = new Map<string, number>()
  for (const matchday of matchdays) {
    const pointsThisMatchday = members.map((member) => ({
      userId: member.userId,
      points: pointsByUserAndMatchday.get(member.userId)?.get(matchday) ?? 0,
    }))
    const maxPoints = Math.max(...pointsThisMatchday.map((row) => row.points))

    for (const row of pointsThisMatchday) {
      if (row.points === maxPoints) {
        matchdaysWonByUser.set(row.userId, (matchdaysWonByUser.get(row.userId) ?? 0) + 1)
      }
    }
  }

  return members.map((member) => {
    const userMatchdays = pointsByUserAndMatchday.get(member.userId)
    let bestMatchday: { matchday: number; points: number } | null = null

    if (userMatchdays) {
      for (const [matchday, points] of userMatchdays) {
        if (!bestMatchday || points > bestMatchday.points) {
          bestMatchday = { matchday, points }
        }
      }
    }

    return {
      userId: member.userId,
      displayName: member.displayName,
      bestMatchday,
      matchdaysWon: matchdaysWonByUser.get(member.userId) ?? 0,
    }
  })
}

async function buildStandings(
  groupId: string,
  predictionRows: PredictionPointsRow[],
): Promise<StandingRow[]> {
  const members = await listMembers(groupId)

  const pointsByUser = new Map<string, number>()
  for (const row of predictionRows) {
    pointsByUser.set(row.user_id, (pointsByUser.get(row.user_id) ?? 0) + row.points)
  }

  const rows = members
    .map((member) => ({
      userId: member.userId,
      displayName: member.displayName,
      totalPoints: pointsByUser.get(member.userId) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)

  let rank = 0
  let previousPoints: number | null = null

  return rows.map((row, index) => {
    if (row.totalPoints !== previousPoints) {
      rank = index + 1
      previousPoints = row.totalPoints
    }
    return { ...row, rank }
  })
}
