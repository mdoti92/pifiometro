import type { ReactNode } from 'react'
import { TeamBadge } from '../teams/TeamBadge'

interface MatchCardProps {
  homeTeam: string
  homeTeamSlug: string
  awayTeam: string
  awayTeamSlug: string
  center: ReactNode
  footer?: ReactNode
}

export function MatchCard({
  homeTeam,
  homeTeamSlug,
  awayTeam,
  awayTeamSlug,
  center,
  footer,
}: MatchCardProps) {
  return (
    <li className="match-card">
      <div className="match-card-teams">
        <div className="match-card-team">
          <TeamBadge name={homeTeam} slug={homeTeamSlug} />
          <span>{homeTeam}</span>
        </div>
        <div className="match-card-center">{center}</div>
        <div className="match-card-team">
          <TeamBadge name={awayTeam} slug={awayTeamSlug} />
          <span>{awayTeam}</span>
        </div>
      </div>
      {footer && <div className="match-card-footer">{footer}</div>}
    </li>
  )
}
