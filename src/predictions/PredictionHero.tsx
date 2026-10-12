import { useEffect, useState } from 'react'
import { getGroupStageStandings, type StandingRow } from '../standings/standingsService'
import { formatCountdown, formatCountdownLabel } from './formatCountdown'
import type { MatchPredictionStatus } from './myPredictionsService'
import { pickNextPendingMatch } from './pickNextPendingMatch'
import { useLiveNow } from './useLiveNow'

interface PredictionHeroProps {
  groupId: string
  stageId: string
  userId: string
  statuses: MatchPredictionStatus[]
}

export function PredictionHero({ groupId, stageId, userId, statuses }: PredictionHeroProps) {
  const [standings, setStandings] = useState<StandingRow[]>([])
  const now = useLiveNow(1000)

  useEffect(() => {
    getGroupStageStandings(groupId, stageId).then(setStandings)
  }, [groupId, stageId])

  const myStanding = standings.find((row) => row.userId === userId)
  const nextMatch = pickNextPendingMatch(statuses, now)

  if (!myStanding && !nextMatch) return null

  function scrollToNextMatch() {
    if (!nextMatch) return
    document.getElementById(`match-${nextMatch.matchId}`)?.scrollIntoView({ behavior: 'smooth' })
  }

  const countdown = nextMatch
    ? formatCountdown(new Date(nextMatch.kickoffAt).getTime() - now.getTime())
    : null

  return (
    <>
      {nextMatch && countdown && (
        <button
          type="button"
          className="prediction-hero prediction-hero-countdown-card"
          onClick={scrollToNextMatch}
          aria-label={`Ir al pronóstico de ${nextMatch.homeTeam} vs ${nextMatch.awayTeam}`}
        >
          <p>Cierra en:</p>
          <p className="font-display prediction-hero-countdown">{formatCountdownLabel(countdown)}</p>
          <h2 className="font-display">
            {nextMatch.homeTeam} vs {nextMatch.awayTeam}
          </h2>
        </button>
      )}

      {myStanding && (
        <section className="prediction-hero">
          <p>Tu puntaje en esta etapa</p>
          <p className="font-display prediction-hero-score">{myStanding.totalPoints} pts</p>
          <p>{myStanding.rank}° lugar</p>
        </section>
      )}
    </>
  )
}
