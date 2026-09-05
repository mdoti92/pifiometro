import type { StandingRow } from './standingsService'

interface StandingsListProps {
  standings: StandingRow[]
  currentUserId?: string
}

export function StandingsList({ standings, currentUserId }: StandingsListProps) {
  return (
    <ul>
      {standings.map((row) => (
        <li key={row.userId} style={{ color: row.userId === currentUserId ? 'var(--hearth)' : 'var(--ink)' }}>
          {row.rank}° — {row.displayName ?? row.userId} — {row.totalPoints} pts
        </li>
      ))}
    </ul>
  )
}
