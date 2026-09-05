import { type FormEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  createMatch,
  editMatch,
  listMatches,
  type EditMatchInput,
  type Match,
} from './matchesAdminService'
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

  async function handleSaveResult(matchId: string, result: EditMatchInput) {
    setError(null)

    try {
      const updated = await editMatch(matchId, result)
      setMatches((current) => current.map((match) => (match.id === updated.id ? updated : match)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el resultado')
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
            {match.status === 'finished' && (
              <span>
                {' '}
                Resultado: {match.homeGoals}-{match.awayGoals}
                {match.wentToPenalties &&
                  ` (penales ${match.homeGoalsPenalties}-${match.awayGoalsPenalties})`}
              </span>
            )}
            <button type="button" onClick={() => startEditing(match)}>
              Editar partido {match.homeTeam} vs {match.awayTeam}
            </button>
            <ResultForm
              match={match}
              onSave={(result) => handleSaveResult(match.id, result)}
            />
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

function ResultForm({
  match,
  onSave,
}: {
  match: Match
  onSave: (result: EditMatchInput) => void
}) {
  const [homeGoals, setHomeGoals] = useState('')
  const [awayGoals, setAwayGoals] = useState('')
  const [wentToPenalties, setWentToPenalties] = useState(false)
  const [homeGoalsPenalties, setHomeGoalsPenalties] = useState('')
  const [awayGoalsPenalties, setAwayGoalsPenalties] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const result: EditMatchInput = {
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      status: 'finished',
    }

    if (wentToPenalties) {
      result.wentToPenalties = true
      result.homeGoalsPenalties = Number(homeGoalsPenalties)
      result.awayGoalsPenalties = Number(awayGoalsPenalties)
    }

    onSave(result)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={`result-home-${match.id}`}>Goles local (resultado)</label>
      <input
        id={`result-home-${match.id}`}
        type="number"
        value={homeGoals}
        onChange={(event) => setHomeGoals(event.target.value)}
      />

      <label htmlFor={`result-away-${match.id}`}>Goles visitante (resultado)</label>
      <input
        id={`result-away-${match.id}`}
        type="number"
        value={awayGoals}
        onChange={(event) => setAwayGoals(event.target.value)}
      />

      {match.isElimination && (
        <>
          <label htmlFor={`result-penalties-${match.id}`}>¿Fue a penales?</label>
          <input
            id={`result-penalties-${match.id}`}
            type="checkbox"
            checked={wentToPenalties}
            onChange={(event) => setWentToPenalties(event.target.checked)}
          />

          {wentToPenalties && (
            <>
              <label htmlFor={`result-home-pen-${match.id}`}>Penales local</label>
              <input
                id={`result-home-pen-${match.id}`}
                type="number"
                value={homeGoalsPenalties}
                onChange={(event) => setHomeGoalsPenalties(event.target.value)}
              />

              <label htmlFor={`result-away-pen-${match.id}`}>Penales visitante</label>
              <input
                id={`result-away-pen-${match.id}`}
                type="number"
                value={awayGoalsPenalties}
                onChange={(event) => setAwayGoalsPenalties(event.target.value)}
              />
            </>
          )}
        </>
      )}

      <button type="submit">
        Guardar resultado {match.homeTeam} vs {match.awayTeam}
      </button>
    </form>
  )
}
