import { Link } from 'react-router-dom'
import type { TournamentStage } from '../tournaments/tournamentsService'

interface StandingsTabsProps {
  groupId: string
  tournamentId: string
  stages: TournamentStage[]
  activeStageId: string | null
}

export function StandingsTabs({ groupId, tournamentId, stages, activeStageId }: StandingsTabsProps) {
  return (
    <nav className="standings-tabs" aria-label="Elegir tabla">
      <Link
        to={`/groups/${groupId}/tournaments/${tournamentId}/standings`}
        className={activeStageId === null ? 'standings-tab active' : 'standings-tab'}
      >
        General
      </Link>
      {stages.map((stage) => (
        <Link
          key={stage.id}
          to={`/groups/${groupId}/stages/${stage.id}/standings`}
          className={activeStageId === stage.id ? 'standings-tab active' : 'standings-tab'}
        >
          {stage.name}
        </Link>
      ))}
    </nav>
  )
}
