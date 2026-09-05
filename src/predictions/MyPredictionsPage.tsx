import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listMatchPredictionStatuses, type MatchPredictionStatus } from './myPredictionsService'

const STATUS_LABEL: Record<MatchPredictionStatus['status'], (m: MatchPredictionStatus) => string> = {
  cargado: (m) => `Cargado: ${m.homeGoals}-${m.awayGoals}`,
  pendiente: () => 'Pendiente',
  no_pronosticado: () => 'No pronosticado (0 puntos posibles)',
}

export function MyPredictionsPage() {
  const { groupId, stageId } = useParams<{ groupId: string; stageId: string }>()
  const { user } = useAuth()
  const [statuses, setStatuses] = useState<MatchPredictionStatus[]>([])

  useEffect(() => {
    if (!groupId || !stageId || !user) return

    listMatchPredictionStatuses(stageId, groupId, user.id).then(setStatuses)
  }, [groupId, stageId, user])

  return (
    <div>
      <h1>Mis pronósticos</h1>

      <ul>
        {statuses.map((match) => (
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
