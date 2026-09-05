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
  const members = await listMembers(groupId)

  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, points, matches!inner(tournament_id)')
    .eq('group_id', groupId)
    .eq('matches.tournament_id', tournamentId)

  if (error) {
    throw new Error(error.message)
  }

  const pointsByUser = new Map<string, number>()
  for (const row of data as unknown as PredictionPointsRow[]) {
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
