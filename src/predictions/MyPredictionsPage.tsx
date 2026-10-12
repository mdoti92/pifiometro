import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { findLastFinishedMatchday } from '../fixture/findLastFinishedMatchday'
import { groupMatchesByMatchday } from '../fixture/groupMatchesByMatchday'
import { MatchCard } from '../matches/MatchCard'
import { listMatchPredictionStatuses, type MatchPredictionStatus } from './myPredictionsService'
import { PredictionHero } from './PredictionHero'
import { savePrediction } from './predictionsService'

const STATUS_LABEL: Record<MatchPredictionStatus['status'], (m: MatchPredictionStatus) => string> = {
  cargado: (m) => `Cargado: ${m.homeGoals}-${m.awayGoals}`,
  pendiente: () => 'Pendiente',
  no_pronosticado: () => 'No pronosticado',
}

function matchdaySectionId(matchday: number | null): string {
  return `fecha-${matchday ?? 'sin-fecha'}`
}

function isMatchFinished(match: MatchPredictionStatus): boolean {
  return match.matchStatus === 'finished'
}

export function MyPredictionsPage() {
  const { groupId, stageId } = useParams<{ groupId: string; stageId: string }>()
  const { user } = useAuth()
  const [statuses, setStatuses] = useState<MatchPredictionStatus[]>([])

  useEffect(() => {
    if (!groupId || !stageId || !user) return

    listMatchPredictionStatuses(stageId, groupId, user.id).then(setStatuses)
  }, [groupId, stageId, user])

  const matchdayGroups = groupMatchesByMatchday(statuses)
  const lastFinishedMatchday = findLastFinishedMatchday(matchdayGroups, isMatchFinished)

  function scrollToLastFinishedMatchday() {
    if (lastFinishedMatchday === null) return
    document.getElementById(matchdaySectionId(lastFinishedMatchday))?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleSaved(matchId: string, homeGoals: number, awayGoals: number) {
    setStatuses((current) =>
      current.map((match) =>
        match.matchId === matchId ? { ...match, status: 'cargado', homeGoals, awayGoals } : match,
      ),
    )
  }

  return (
    <div>
      <h1>Mis pronósticos</h1>

      {groupId && stageId && user && (
        <PredictionHero groupId={groupId} stageId={stageId} userId={user.id} />
      )}

      {lastFinishedMatchday !== null && (
        <button type="button" onClick={scrollToLastFinishedMatchday}>
          Ver desde última fecha cargada
        </button>
      )}

      {matchdayGroups.map((group) => (
        <section key={group.matchday ?? 'sin-fecha'} id={matchdaySectionId(group.matchday)}>
          <h2 className="font-display">
            {group.matchday !== null ? `Fecha ${group.matchday}` : 'Sin fecha asignada'}
          </h2>
          <ul className="matchday-grid">
            {group.matches.map((match) => (
              <PredictionMatchCard
                key={match.matchId}
                match={match}
                groupId={groupId ?? ''}
                userId={user?.id ?? ''}
                onSaved={handleSaved}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function PredictionMatchCard({
  match,
  groupId,
  userId,
  onSaved,
}: {
  match: MatchPredictionStatus
  groupId: string
  userId: string
  onSaved: (matchId: string, homeGoals: number, awayGoals: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [homeGoals, setHomeGoals] = useState('')
  const [awayGoals, setAwayGoals] = useState('')
  const [error, setError] = useState<string | null>(null)

  const canEdit = match.matchStatus !== 'finished'

  function startEditing() {
    setHomeGoals(match.homeGoals !== null ? String(match.homeGoals) : '')
    setAwayGoals(match.awayGoals !== null ? String(match.awayGoals) : '')
    setError(null)
    setEditing(true)
  }

  async function handleConfirm() {
    setError(null)

    try {
      await savePrediction({
        matchId: match.matchId,
        groupId,
        userId,
        homeGoals: Number(homeGoals),
        awayGoals: Number(awayGoals),
      })
      onSaved(match.matchId, Number(homeGoals), Number(awayGoals))
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el pronóstico')
    }
  }

  const center = editing ? (
    <div className="prediction-inline-edit">
      <input
        aria-label={`Goles local de ${match.homeTeam}`}
        type="number"
        value={homeGoals}
        onChange={(event) => setHomeGoals(event.target.value)}
      />
      <span>-</span>
      <input
        aria-label={`Goles visitante de ${match.awayTeam}`}
        type="number"
        value={awayGoals}
        onChange={(event) => setAwayGoals(event.target.value)}
      />
    </div>
  ) : (
    STATUS_LABEL[match.status](match)
  )

  const footer = editing ? (
    <>
      <button type="button" onClick={handleConfirm}>
        Confirmar
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  ) : canEdit ? (
    <button
      type="button"
      onClick={startEditing}
      aria-label={`Editar pronóstico de ${match.homeTeam} vs ${match.awayTeam}`}
    >
      ✏️
    </button>
  ) : undefined

  return (
    <MatchCard
      homeTeam={match.homeTeam}
      homeTeamSlug={match.homeTeamSlug}
      awayTeam={match.awayTeam}
      awayTeamSlug={match.awayTeamSlug}
      center={center}
      footer={footer}
    />
  )
}
