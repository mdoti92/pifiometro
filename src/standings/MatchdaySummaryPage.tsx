import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMatchdaySummaries, type MatchdaySummary } from './standingsService'

export function MatchdaySummaryPage() {
  const { groupId, tournamentId } = useParams<{ groupId: string; tournamentId: string }>()
  const [summaries, setSummaries] = useState<MatchdaySummary[]>([])

  useEffect(() => {
    if (!groupId || !tournamentId) return

    getMatchdaySummaries(groupId, tournamentId).then(setSummaries)
  }, [groupId, tournamentId])

  return (
    <div>
      <h1>Mejor fecha y fechas ganadas</h1>

      <ul>
        {summaries.map((summary) => (
          <li key={summary.userId}>
            {summary.displayName ?? summary.userId} — Mejor fecha:{' '}
            {summary.bestMatchday
              ? `Fecha ${summary.bestMatchday.matchday} (${summary.bestMatchday.points} pts)`
              : '—'}{' '}
            — Fechas ganadas: {summary.matchdaysWon}
          </li>
        ))}
      </ul>
    </div>
  )
}
