import { useEffect, useState } from 'react'
import { getGroupStageStandings, type StandingRow } from '../standings/standingsService'

interface PredictionHeroProps {
  groupId: string
  stageId: string
  userId: string
}

export function PredictionHero({ groupId, stageId, userId }: PredictionHeroProps) {
  const [standings, setStandings] = useState<StandingRow[]>([])

  useEffect(() => {
    getGroupStageStandings(groupId, stageId).then(setStandings)
  }, [groupId, stageId])

  const myStanding = standings.find((row) => row.userId === userId)

  if (!myStanding) return null

  return (
    <section className="prediction-hero">
      <p>Tu puntaje en esta etapa</p>
      <p className="font-display prediction-hero-score">{myStanding.totalPoints} pts</p>
      <p>{myStanding.rank}° lugar</p>
    </section>
  )
}
