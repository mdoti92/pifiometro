import { useEffect, useState } from 'react'
import { getOrdinalLabel } from '../design/ordinalLabel'
import { getRankChipColor } from '../design/rankChipColor'
import { getGroupStageStandings, type StandingRow } from '../standings/standingsService'

interface RankChipProps {
  groupId: string
  stageId: string
  userId: string
}

export function RankChip({ groupId, stageId, userId }: RankChipProps) {
  const [standings, setStandings] = useState<StandingRow[]>([])

  useEffect(() => {
    getGroupStageStandings(groupId, stageId).then(setStandings)
  }, [groupId, stageId])

  const myStanding = standings.find((row) => row.userId === userId)
  if (!myStanding) return null

  return (
    <span
      className="rank-chip font-display"
      style={{ backgroundColor: getRankChipColor(myStanding.rank) }}
    >
      {myStanding.totalPoints} pts - {getOrdinalLabel(myStanding.rank)}
    </span>
  )
}
