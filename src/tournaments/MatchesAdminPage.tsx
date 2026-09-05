import { type FormEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { createMatch, editMatch, listMatches, type Match } from './matchesAdminService'
import { isSuperadmin, listTournamentStages, type TournamentStage } from './tournamentsService'

export function MatchesAdminPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const [admin, setAdmin] = useState<boolean | null>(null)
  const [stages, setStages] = useState<TournamentStage[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [error, setError] = useState<string | null>(null)

  const [stageId, setStageId] = useState('')
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [kickoffAt, setKickoffAt] = useState('')
  const [isElimination, setIsElimination] = useState(false)

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null)
  const [editHomeTeam, setEditHomeTeam] = useState('')
  const [editAwayTeam, setEditAwayTeam] = useState('')
  const [editKickoffAt, setEditKickoffAt] = useState('')
  const [editIsElimination, setEditIsElimination] = useState(false)

  useEffect(() => {
    if (!tournamentId) return

    isSuperadmin().then((isAdmin) => {
      setAdmin(isAdmin)
      if (isAdmin) {
        listTournamentStages(tournamentId).then((loadedStages) => {
          setStages(loadedStages)
          setStageId(loadedStages[0]?.id ?? '')
        })
        listMatches(tournamentId).then(setMatches)
      }
    })
  }, [tournamentId])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!tournamentId) return

    try {
      const match = await createMatch({
        tournamentId,
        stageId: stageId || null,
        homeTeam,
        awayTeam,
        kickoffAt,
        isElimination,
      })
      setMatches((current) => [...current, match])
      setHomeTeam('')
      setAwayTeam('')
      setKickoffAt('')
      setIsElimination(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el partido')
    }
  }

  function startEditing(match: Match) {
    setEditingMatchId(match.id)
    setEditHomeTeam(match.homeTeam)
    setEditAwayTeam(match.awayTeam)
    setEditKickoffAt(match.kickoffAt)
    setEditIsElimination(match.isElimination)
  }

  async function handleEdit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!editingMatchId) return

    try {
      const updated = await editMatch(editingMatchId, {
        homeTeam: editHomeTeam,
        awayTeam: editAwayTeam,
        kickoffAt: editKickoffAt,
        isElimination: editIsElimination,
      })
      setMatches((current) => current.map((match) => (match.id === updated.id ? updated : match)))
      setEditingMatchId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo editar el partido')
    }
  }

  if (admin === null) return null

  if (!admin) return <p>No tenés permisos para administrar partidos</p>

  return (
    <div>
      <form onSubmit={handleCreate}>
        <h1>Cargar partido</h1>

        <label htmlFor="match-stage">Etapa</label>
        <select id="match-stage" value={stageId} onChange={(event) => setStageId(event.target.value)}>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>

        <label htmlFor="match-home">Local</label>
        <input id="match-home" value={homeTeam} onChange={(event) => setHomeTeam(event.target.value)} />

        <label htmlFor="match-away">Visitante</label>
        <input id="match-away" value={awayTeam} onChange={(event) => setAwayTeam(event.target.value)} />

        <label htmlFor="match-kickoff">Fecha y hora</label>
        <input
          id="match-kickoff"
          type="datetime-local"
          value={kickoffAt}
          onChange={(event) => setKickoffAt(event.target.value)}
        />

        <label htmlFor="match-elimination">Partido de eliminación</label>
        <input
          id="match-elimination"
          type="checkbox"
          checked={isElimination}
          onChange={(event) => setIsElimination(event.target.checked)}
        />

        <button type="submit">Cargar partido</button>
      </form>

      {error && <p role="alert">{error}</p>}

      <ul>
        {matches.map((match) => (
          <li key={match.id}>
            {match.homeTeam} vs {match.awayTeam} — {match.source}
            <button type="button" onClick={() => startEditing(match)}>
              Editar partido {match.homeTeam} vs {match.awayTeam}
            </button>
          </li>
        ))}
      </ul>

      {editingMatchId && (
        <form onSubmit={handleEdit}>
          <h2>Editar partido</h2>

          <label htmlFor="edit-home">Local (editar)</label>
          <input
            id="edit-home"
            value={editHomeTeam}
            onChange={(event) => setEditHomeTeam(event.target.value)}
          />

          <label htmlFor="edit-away">Visitante (editar)</label>
          <input
            id="edit-away"
            value={editAwayTeam}
            onChange={(event) => setEditAwayTeam(event.target.value)}
          />

          <label htmlFor="edit-kickoff">Fecha y hora (editar)</label>
          <input
            id="edit-kickoff"
            type="datetime-local"
            value={editKickoffAt}
            onChange={(event) => setEditKickoffAt(event.target.value)}
          />

          <label htmlFor="edit-elimination">Partido de eliminación (editar)</label>
          <input
            id="edit-elimination"
            type="checkbox"
            checked={editIsElimination}
            onChange={(event) => setEditIsElimination(event.target.checked)}
          />

          <button type="submit">Guardar cambios</button>
        </form>
      )}
    </div>
  )
}
