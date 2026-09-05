import { type FormEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getMatch, getPrediction, hasKickedOff, savePrediction } from './predictionsService'

const MATCH_STARTED_MESSAGE = 'El partido ya arrancó, no se puede cargar ni editar el pronóstico'

export function PredictionForm() {
  const { groupId, matchId } = useParams<{ groupId: string; matchId: string }>()
  const { user } = useAuth()
  const [homeGoals, setHomeGoals] = useState('')
  const [awayGoals, setAwayGoals] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (!groupId || !matchId || !user) return

    getMatch(matchId).then((match) => setLocked(hasKickedOff(match.kickoffAt)))

    getPrediction(matchId, groupId, user.id).then((prediction) => {
      if (prediction) {
        setHomeGoals(String(prediction.homeGoals))
        setAwayGoals(String(prediction.awayGoals))
      }
    })
  }, [groupId, matchId, user])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    if (!groupId || !matchId || !user) return

    if (locked) {
      setError(MATCH_STARTED_MESSAGE)
      return
    }

    try {
      await savePrediction({
        matchId,
        groupId,
        userId: user.id,
        homeGoals: Number(homeGoals),
        awayGoals: Number(awayGoals),
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el pronóstico')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Cargar pronóstico</h1>

      <label htmlFor="home-goals">Goles local</label>
      <input
        id="home-goals"
        type="number"
        value={homeGoals}
        disabled={locked}
        onChange={(event) => setHomeGoals(event.target.value)}
      />

      <label htmlFor="away-goals">Goles visitante</label>
      <input
        id="away-goals"
        type="number"
        value={awayGoals}
        disabled={locked}
        onChange={(event) => setAwayGoals(event.target.value)}
      />

      {locked && <p>{MATCH_STARTED_MESSAGE}</p>}
      {error && <p role="alert">{error}</p>}
      {saved && <p>Pronóstico guardado</p>}

      <button type="submit" disabled={locked}>
        Guardar pronóstico
      </button>
    </form>
  )
}
