import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { StandingsList } from './StandingsList'
import { getGroupStageStandings, type StandingRow } from './standingsService'

export function StageStandingsPage() {
  const { groupId, stageId } = useParams<{ groupId: string; stageId: string }>()
  const [standings, setStandings] = useState<StandingRow[]>([])

  useEffect(() => {
    if (!groupId || !stageId) return

    getGroupStageStandings(groupId, stageId).then(setStandings)
  }, [groupId, stageId])

  return (
    <div>
      <h1>Tabla por etapa</h1>
      <StandingsList standings={standings} />
    </div>
  )
}
