import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listTournamentStages, type TournamentStage } from '../tournaments/tournamentsService'
import { StandingsList } from './StandingsList'
import { StandingsTabs } from './StandingsTabs'
import { getGroupTournamentStandings, type StandingRow } from './standingsService'

export function StandingsPage() {
  const { groupId, tournamentId } = useParams<{ groupId: string; tournamentId: string }>()
  const { user } = useAuth()
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [stages, setStages] = useState<TournamentStage[]>([])

  useEffect(() => {
    if (!groupId || !tournamentId) return

    getGroupTournamentStandings(groupId, tournamentId).then(setStandings)
    listTournamentStages(tournamentId).then(setStages)
  }, [groupId, tournamentId])

  return (
    <div>
      <h1>Tabla general</h1>

      {groupId && tournamentId && (
        <StandingsTabs groupId={groupId} tournamentId={tournamentId} stages={stages} activeStageId={null} />
      )}

      <StandingsList standings={standings} currentUserId={user?.id} />
    </div>
  )
}
