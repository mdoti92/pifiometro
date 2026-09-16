import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getStage, listTournamentStages, type TournamentStage } from '../tournaments/tournamentsService'
import { StandingsList } from './StandingsList'
import { StandingsTabs } from './StandingsTabs'
import { getGroupStageStandings, type StandingRow } from './standingsService'

export function StageStandingsPage() {
  const { groupId, stageId } = useParams<{ groupId: string; stageId: string }>()
  const { user } = useAuth()
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [stage, setStage] = useState<TournamentStage | null>(null)
  const [siblingStages, setSiblingStages] = useState<TournamentStage[]>([])

  useEffect(() => {
    if (!groupId || !stageId) return

    getGroupStageStandings(groupId, stageId).then(setStandings)
    getStage(stageId).then((loadedStage) => {
      setStage(loadedStage)
      if (loadedStage) {
        listTournamentStages(loadedStage.tournamentId).then(setSiblingStages)
      }
    })
  }, [groupId, stageId])

  return (
    <div>
      <h1>Tabla por etapa</h1>

      {groupId && stage && (
        <StandingsTabs
          groupId={groupId}
          tournamentId={stage.tournamentId}
          stages={siblingStages}
          activeStageId={stageId ?? null}
        />
      )}

      <StandingsList standings={standings} currentUserId={user?.id} />
    </div>
  )
}
