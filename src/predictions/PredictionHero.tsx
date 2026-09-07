import { Link } from 'react-router-dom'
import { formatCountdown } from './formatCountdown'
import type { MatchPredictionStatus } from './myPredictionsService'

interface PredictionHeroProps {
  match: MatchPredictionStatus
  groupId: string
  now: Date
}

export function PredictionHero({ match, groupId, now }: PredictionHeroProps) {
  const countdown = formatCountdown(new Date(match.kickoffAt).getTime() - now.getTime())

  return (
    <section className="prediction-hero">
      <p>Cierra en:</p>
      <p className="font-display prediction-hero-countdown">
        {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
      </p>
      <h2 className="font-display">
        {match.homeTeam} vs {match.awayTeam}
      </h2>
      <Link
        to={`/groups/${groupId}/matches/${match.matchId}/predict`}
        aria-label={`Cargar pronóstico de ${match.homeTeam} vs ${match.awayTeam}`}
      >
        Cargar pronóstico
      </Link>
    </section>
  )
}
