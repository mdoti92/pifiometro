import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { StandingsList } from './StandingsList'
import { getGroupTournamentStandings, type StandingRow } from './standingsService'

export function StandingsPage() {
  const { groupId, tournamentId } = useParams<{ groupId: string; tournamentId: string }>()
  const [standings, setStandings] = useState<StandingRow[]>([])

  useEffect(() => {
    if (!groupId || !tournamentId) return

    getGroupTournamentStandings(groupId, tournamentId).then(setStandings)
  }, [groupId, tournamentId])

  return (
    <div>
      <h1>Tabla general</h1>
      <StandingsList standings={standings} />
    </div>
  )
}
