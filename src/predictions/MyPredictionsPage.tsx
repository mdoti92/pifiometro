import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listMatchPredictionStatuses, type MatchPredictionStatus } from './myPredictionsService'
import { pickNextPendingMatch } from './pickNextPendingMatch'
import { PredictionHero } from './PredictionHero'
import { useLiveNow } from './useLiveNow'

const LIVE_NOW_INTERVAL_MS = 1000

const STATUS_LABEL: Record<MatchPredictionStatus['status'], (m: MatchPredictionStatus) => string> = {
  cargado: (m) => `Cargado: ${m.homeGoals}-${m.awayGoals}`,
  pendiente: () => 'Pendiente',
  no_pronosticado: () => 'No pronosticado (0 puntos posibles)',
}

export function MyPredictionsPage() {
  const { groupId, stageId } = useParams<{ groupId: string; stageId: string }>()
  const { user } = useAuth()
  const [statuses, setStatuses] = useState<MatchPredictionStatus[]>([])
  const now = useLiveNow(LIVE_NOW_INTERVAL_MS)

  useEffect(() => {
    if (!groupId || !stageId || !user) return

    listMatchPredictionStatuses(stageId, groupId, user.id).then(setStatuses)
  }, [groupId, stageId, user])

  const heroMatch = pickNextPendingMatch(statuses, now)
  const restOfMatches = statuses.filter((match) => match.matchId !== heroMatch?.matchId)

  return (
    <div>
      <h1>Mis pronósticos</h1>

      {heroMatch && groupId && <PredictionHero match={heroMatch} groupId={groupId} now={now} />}

      <ul>
        {restOfMatches.map((match) => (
          <li key={match.matchId}>
            <span>
              {match.homeTeam} vs {match.awayTeam} — {STATUS_LABEL[match.status](match)}
            </span>
            {match.status !== 'no_pronosticado' && (
              <Link
                to={`/groups/${groupId}/matches/${match.matchId}/predict`}
                aria-label={`Cargar o editar pronóstico de ${match.homeTeam} vs ${match.awayTeam}`}
              >
                Cargar/editar
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
