import { formatCountdown, formatCountdownLabel } from './formatCountdown'
import type { MatchPredictionStatus } from './myPredictionsService'
import { pickNextPendingMatch } from './pickNextPendingMatch'
import { useLiveNow } from './useLiveNow'

interface PredictionHeroProps {
  statuses: MatchPredictionStatus[]
}

export function PredictionHero({ statuses }: PredictionHeroProps) {
  const now = useLiveNow(1000)
  const nextMatch = pickNextPendingMatch(statuses, now)

  if (!nextMatch) return null

  function scrollToNextMatch() {
    if (!nextMatch) return
    document.getElementById(`match-${nextMatch.matchId}`)?.scrollIntoView({ behavior: 'smooth' })
  }

  const countdown = formatCountdown(new Date(nextMatch.kickoffAt).getTime() - now.getTime())

  return (
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
  )
}
