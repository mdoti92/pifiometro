import type { StandingRow } from './standingsService'

interface StandingsListProps {
  standings: StandingRow[]
  currentUserId?: string
}

export function StandingsList({ standings, currentUserId }: StandingsListProps) {
  return (
    <table className="standings-table">
      <thead>
        <tr>
          <th>Posición</th>
          <th>Jugador</th>
          <th>Puntos</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((row) => (
          <tr key={row.userId} style={{ color: row.userId === currentUserId ? 'var(--hearth)' : 'var(--ink)' }}>
            <td>{row.rank}°</td>
            <td>{row.displayName ?? row.userId}</td>
            <td>{row.totalPoints} pts</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
