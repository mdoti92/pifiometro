import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { StandingsList } from './StandingsList'
import { getGroupTournamentStandings, type StandingRow } from './standingsService'

export function StandingsPage() {
  const { groupId, tournamentId } = useParams<{ groupId: string; tournamentId: string }>()
  const { user } = useAuth()
  const [standings, setStandings] = useState<StandingRow[]>([])

  useEffect(() => {
    if (!groupId || !tournamentId) return

    getGroupTournamentStandings(groupId, tournamentId).then(setStandings)
  }, [groupId, tournamentId])

  return (
    <div>
      <h1>Tabla general</h1>
      <StandingsList standings={standings} currentUserId={user?.id} />
    </div>
  )
}
