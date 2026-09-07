import { type FormEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { listTeams, type Team } from '../teams/teamsService'
import {
  createMatch,
  editMatch,
  listMatches,
  type EditMatchInput,
  type Match,
} from './matchesAdminService'
import { isSuperadmin, listTournamentStages, type TournamentStage } from './tournamentsService'

const SAME_TEAM_ERROR = 'El equipo local y el visitante no pueden ser el mismo'

export function MatchesAdminPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const [admin, setAdmin] = useState<boolean | null>(null)
  const [stages, setStages] = useState<TournamentStage[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [error, setError] = useState<string | null>(null)

  const [stageId, setStageId] = useState('')
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [kickoffAt, setKickoffAt] = useState('')
  const [isElimination, setIsElimination] = useState(false)
  const [matchday, setMatchday] = useState('')

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null)
  const [editHomeTeamId, setEditHomeTeamId] = useState('')
  const [editAwayTeamId, setEditAwayTeamId] = useState('')
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
        listTeams().then((loadedTeams) => {
          setTeams(loadedTeams)
          setHomeTeamId(loadedTeams[0]?.id ?? '')
          setAwayTeamId(loadedTeams[1]?.id ?? loadedTeams[0]?.id ?? '')
        })
        listMatches(tournamentId).then(setMatches)
      }
    })
  }, [tournamentId])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!tournamentId) return

    if (homeTeamId === awayTeamId) {
      setError(SAME_TEAM_ERROR)
      return
    }

    try {
      const match = await createMatch({
        tournamentId,
        stageId: stageId || null,
        homeTeamId,
        awayTeamId,
        kickoffAt,
        isElimination,
        ...(matchday ? { matchday: Number(matchday) } : {}),
      })
      setMatches((current) => [...current, match])
      setKickoffAt('')
      setIsElimination(false)
      setMatchday('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el partido')
    }
  }

  function startEditing(match: Match) {
    setEditingMatchId(match.id)
    setEditHomeTeamId(match.homeTeamId)
    setEditAwayTeamId(match.awayTeamId)
    setEditKickoffAt(match.kickoffAt)
    setEditIsElimination(match.isElimination)
  }

  async function handleEdit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!editingMatchId) return

    if (editHomeTeamId === editAwayTeamId) {
      setError(SAME_TEAM_ERROR)
      return
    }

    try {
      const updated = await editMatch(editingMatchId, {
        homeTeamId: editHomeTeamId,
        awayTeamId: editAwayTeamId,
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
        <select id="match-home" value={homeTeamId} onChange={(event) => setHomeTeamId(event.target.value)}>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        <label htmlFor="match-away">Visitante</label>
        <select id="match-away" value={awayTeamId} onChange={(event) => setAwayTeamId(event.target.value)}>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        <label htmlFor="match-kickoff">Fecha y hora</label>
        <input
          id="match-kickoff"
          type="datetime-local"
          value={kickoffAt}
          onChange={(event) => setKickoffAt(event.target.value)}
        />

        <label htmlFor="match-matchday">Número de fecha</label>
        <input
          id="match-matchday"
          type="number"
          value={matchday}
          onChange={(event) => setMatchday(event.target.value)}
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
          <select
            id="edit-home"
            value={editHomeTeamId}
            onChange={(event) => setEditHomeTeamId(event.target.value)}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <label htmlFor="edit-away">Visitante (editar)</label>
          <select
            id="edit-away"
            value={editAwayTeamId}
            onChange={(event) => setEditAwayTeamId(event.target.value)}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

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
