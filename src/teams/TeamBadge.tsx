import { useState } from 'react'
import { getTeamBadgeColor, getTeamInitials } from './teamBadgeHelpers'

interface TeamBadgeProps {
  name: string
  slug: string
}

type LogoAttempt = 'svg' | 'png' | 'fallback'

export function TeamBadge({ name, slug }: TeamBadgeProps) {
  const [attempt, setAttempt] = useState<LogoAttempt>('svg')

  if (attempt === 'fallback') {
    return (
      <span
        className="team-badge team-badge-fallback"
        style={{ backgroundColor: getTeamBadgeColor(slug) }}
      >
        {getTeamInitials(name)}
      </span>
    )
  }

  return (
    <img
      className="team-badge"
      src={`/team-logos/${slug}.${attempt}`}
      alt={name}
      onError={() => setAttempt((current) => (current === 'svg' ? 'png' : 'fallback'))}
    />
  )
}
