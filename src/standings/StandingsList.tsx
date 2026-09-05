import type { StandingRow } from './standingsService'

export function StandingsList({ standings }: { standings: StandingRow[] }) {
  return (
    <ul>
      {standings.map((row) => (
        <li key={row.userId}>
          {row.rank}° — {row.displayName ?? row.userId} — {row.totalPoints} pts
        </li>
      ))}
    </ul>
  )
}
