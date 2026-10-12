import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isGroupAdmin } from './groupMembersService'
import {
  activateTournament,
  deactivateTournament,
  listAvailableTournaments,
  listGroupTournaments,
  type Tournament,
} from './groupTournamentsService'

interface TournamentRow extends Tournament {
  linked: boolean
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
          available
            .map((tournament) => {
              const groupTournament = groupTournaments.find((gt) => gt.tournamentId === tournament.id)
              return {
                ...tournament,
                linked: groupTournament !== undefined,
                active: groupTournament?.active ?? false,
              }
            })
            .sort((a, b) => (b.season ?? '').localeCompare(a.season ?? '')),
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
          row.id === tournamentId ? { ...row, linked: true, active: !currentlyActive } : row,
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

      <table className="tournaments-table">
        <thead>
          <tr>
            <th>Torneo</th>
            <th>Estado</th>
            <th>Ver</th>
            {admin && <th>Administrar</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <span>{row.name}</span>
                {row.season && <span> — Temporada {row.season}</span>}
              </td>
              <td>{row.active && <span className="badge-vigente">Vigente</span>}</td>
              <td>
                {row.linked && (
                  <>
                    <Link to={`/groups/${groupId}/tournaments/${row.id}/standings`}>
                      Ver tabla de {row.name}
                    </Link>{' '}
                    <Link to={`/groups/${groupId}/tournaments/${row.id}/history`}>
                      Ver historial de {row.name}
                    </Link>
                  </>
                )}
              </td>
              {admin && (
                <td>
                  <button type="button" onClick={() => handleToggle(row.id, row.active)}>
                    {row.active ? `Desactivar ${row.name}` : `Activar ${row.name}`}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
