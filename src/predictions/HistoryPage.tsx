import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getPredictionStatusColor } from '../design/predictionStatusColor'
import { getMatchHistory, type HistoryStatus, type MatchHistoryRow } from './historyService'

const STATUS_LABEL: Record<HistoryStatus, string> = {
  exacto: 'Exacto',
  resultado: 'Resultado',
  pifiado: 'Pifiado',
  no_pronosticado: 'No pronosticado',
  por_definir: 'Por definir',
}

function formatScore(homeGoals: number | null, awayGoals: number | null): string {
  return homeGoals === null || awayGoals === null ? '—' : `${homeGoals}-${awayGoals}`
}

export function HistoryPage() {
  const { groupId, tournamentId } = useParams<{ groupId: string; tournamentId: string }>()
  const { user } = useAuth()
  const [history, setHistory] = useState<MatchHistoryRow[]>([])

  useEffect(() => {
    if (!groupId || !tournamentId || !user) return

    getMatchHistory(tournamentId, groupId, user.id).then(setHistory)
  }, [groupId, tournamentId, user])

  return (
    <div>
      <h1>Historial de pronósticos</h1>

      <ul>
        {history.map((row) => (
          <li key={row.matchId}>
            {row.homeTeam} vs {row.awayTeam} — Mi pronóstico:{' '}
            {formatScore(row.predictedHomeGoals, row.predictedAwayGoals)} — Resultado:{' '}
            {formatScore(row.actualHomeGoals, row.actualAwayGoals)} —{' '}
            <span style={{ color: getPredictionStatusColor(row.status) }}>
              {STATUS_LABEL[row.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
