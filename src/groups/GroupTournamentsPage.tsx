import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isGroupAdmin } from './groupMembersService'
import {
  activateTournament,
  deactivateTournament,
  listAvailableTournaments,
  listGroupTournaments,
  type Tournament,
} from './groupTournamentsService'

interface TournamentRow extends Tournament {
  active: boolean
}

export function GroupTournamentsPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [admin, setAdmin] = useState(false)
  const [rows, setRows] = useState<TournamentRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId) return

    Promise.all([isGroupAdmin(groupId), listAvailableTournaments(), listGroupTournaments(groupId)]).then(
      ([isAdmin, available, groupTournaments]) => {
        setAdmin(isAdmin)
        setRows(
          available.map((tournament) => ({
            ...tournament,
            active: groupTournaments.some((gt) => gt.tournamentId === tournament.id && gt.active),
          })),
        )
      },
    )
  }, [groupId])

  async function handleToggle(tournamentId: string, currentlyActive: boolean) {
    if (!groupId) return
    setError(null)

    try {
      if (currentlyActive) {
        await deactivateTournament(groupId, tournamentId)
      } else {
        await activateTournament(groupId, tournamentId)
      }
      setRows((current) =>
        current.map((row) =>
          row.id === tournamentId ? { ...row, active: !currentlyActive } : row,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el torneo')
    }
  }

  return (
    <div>
      <h1>Torneos del grupo</h1>

      {error && <p role="alert">{error}</p>}

      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <span>{row.name}</span> {row.active ? '(activo)' : '(inactivo)'}
            {admin && (
              <button type="button" onClick={() => handleToggle(row.id, row.active)}>
                {row.active ? `Desactivar ${row.name}` : `Activar ${row.name}`}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
