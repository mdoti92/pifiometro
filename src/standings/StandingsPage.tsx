import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listTournamentStages, type TournamentStage } from '../tournaments/tournamentsService'
import { StandingsList } from './StandingsList'
import { getGroupStageStandings, getGroupTournamentStandings, type StandingRow } from './standingsService'

const GENERAL_TABLE_ID = 'general'

interface StandingsTable {
  id: string
  title: string
  standings: StandingRow[]
}

export function StandingsPage() {
  const { groupId, tournamentId } = useParams<{ groupId: string; tournamentId: string }>()
  const { user } = useAuth()
  const [generalStandings, setGeneralStandings] = useState<StandingRow[]>([])
  const [stages, setStages] = useState<TournamentStage[]>([])
  const [standingsByStage, setStandingsByStage] = useState<Record<string, StandingRow[]>>({})
  const [hiddenTableIds, setHiddenTableIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!groupId || !tournamentId) return

    getGroupTournamentStandings(groupId, tournamentId).then(setGeneralStandings)
    listTournamentStages(tournamentId).then((loadedStages) => {
      setStages(loadedStages)
      for (const stage of loadedStages) {
        getGroupStageStandings(groupId, stage.id).then((standings) =>
          setStandingsByStage((current) => ({ ...current, [stage.id]: standings })),
        )
      }
    })
  }, [groupId, tournamentId])

  const tables: StandingsTable[] = [
    { id: GENERAL_TABLE_ID, title: 'General', standings: generalStandings },
    ...stages.map((stage) => ({ id: stage.id, title: stage.name, standings: standingsByStage[stage.id] ?? [] })),
  ]

  function toggleTable(tableId: string) {
    setHiddenTableIds((current) => {
      const next = new Set(current)
      if (next.has(tableId)) {
        next.delete(tableId)
      } else {
        next.add(tableId)
      }
      return next
    })
  }

  return (
    <div>
      <h1>Tabla</h1>

      <div className="standings-tabs" role="group" aria-label="Tablas visibles">
        {tables.map((table) => {
          const visible = !hiddenTableIds.has(table.id)
          return (
            <button
              key={table.id}
              type="button"
              aria-pressed={visible}
              className={visible ? 'standings-tab active' : 'standings-tab'}
              onClick={() => toggleTable(table.id)}
            >
              {table.title}
            </button>
          )
        })}
      </div>

      {tables
        .filter((table) => !hiddenTableIds.has(table.id))
        .map((table) => (
          <section key={table.id} className="standings-section" aria-labelledby={`standings-${table.id}`}>
            <h2 id={`standings-${table.id}`}>{table.title}</h2>
            <StandingsList standings={table.standings} currentUserId={user?.id} />
          </section>
        ))}
    </div>
  )
}
