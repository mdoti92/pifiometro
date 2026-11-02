import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getPredictionStatusColor } from '../design/predictionStatusColor'
import { findCurrentMatchday } from '../fixture/findCurrentMatchday'
import { groupMatchesByMatchday } from '../fixture/groupMatchesByMatchday'
import { matchdaySectionId, scrollToMatchday, useScrollToMatchdayOnLoad } from '../fixture/useScrollToMatchday'
import { MatchCard } from '../matches/MatchCard'
import { GandalfLaugh } from './GandalfLaugh'
import { getStageMatchdayLeaders, type MatchdayLeader } from '../standings/standingsService'
import { listMatchPredictionStatuses, type MatchPredictionStatus } from './myPredictionsService'
import { PredictionHero } from './PredictionHero'
import { isPredictionClosed, savePrediction } from './predictionsService'
import { RankChip } from './RankChip'
import { useLiveNow } from './useLiveNow'

const STATUS_LABEL: Record<MatchPredictionStatus['status'], (m: MatchPredictionStatus) => string> = {
  cargado: (m) => `${m.homeGoals}-${m.awayGoals}`,
  pendiente: () => 'Pendiente',
  no_pronosticado: () => 'Sin cargar',
}

function ReadOnlyPrediction({ match }: { match: MatchPredictionStatus }) {
  const color = match.outcome ? getPredictionStatusColor(match.outcome) : undefined
  const hasActualResult = match.actualHomeGoals !== null && match.actualAwayGoals !== null

  return (
    <div className="prediction-readonly">
      <span style={color ? { color } : undefined}>{STATUS_LABEL[match.status](match)}</span>
      {hasActualResult && (
        <span className="prediction-actual-result">
          Resultado: {match.actualHomeGoals}-{match.actualAwayGoals}
        </span>
      )}
    </div>
  )
}

// Un postergado no traba la fecha: se reprograma más adelante.
function isMatchPending(match: MatchPredictionStatus): boolean {
  return match.matchStatus === 'scheduled'
}

function isMatchFinished(match: MatchPredictionStatus): boolean {
  return match.matchStatus === 'finished'
}

function formatPoints(points: number): string {
  return `${points} ${points === 1 ? 'pt' : 'pts'}`
}

function formatMatchdayPoints(matches: MatchPredictionStatus[]): string | null {
  if (!matches.some(isMatchFinished)) return null

  return formatPoints(matches.reduce((total, match) => total + (match.points ?? 0), 0))
}

function formatMatchdayLeader(leader: MatchdayLeader | undefined): string | null {
  if (!leader) return null

  return `Mejor: ${leader.names.join(', ')} (${formatPoints(leader.points)})`
}

export function MyPredictionsPage() {
  const { groupId, stageId } = useParams<{ groupId: string; stageId: string }>()
  const { user } = useAuth()
  const [statuses, setStatuses] = useState<MatchPredictionStatus[]>([])
  const [matchdayLeaders, setMatchdayLeaders] = useState<Map<number, MatchdayLeader>>(new Map())

  useEffect(() => {
    if (!groupId || !stageId || !user) return

    listMatchPredictionStatuses(stageId, groupId, user.id).then(setStatuses)
  }, [groupId, stageId, user])

  useEffect(() => {
    if (!groupId || !stageId) return

    getStageMatchdayLeaders(groupId, stageId).then(setMatchdayLeaders)
  }, [groupId, stageId])

  const matchdayGroups = groupMatchesByMatchday(statuses)
  const currentMatchday = findCurrentMatchday(matchdayGroups, isMatchPending)
  useScrollToMatchdayOnLoad(currentMatchday, stageId)

  function goToCurrentMatchday() {
    if (currentMatchday !== null) scrollToMatchday(currentMatchday)
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
      <div className="predictions-header">
        <h1>Mis pronósticos</h1>
        {groupId && stageId && user && (
          <RankChip groupId={groupId} stageId={stageId} userId={user.id} />
        )}
      </div>

      <PredictionHero statuses={statuses} />

      {currentMatchday !== null && (
        <button type="button" onClick={goToCurrentMatchday}>
          Ir a la fecha actual
        </button>
      )}

      {matchdayGroups.map((group) => {
        const matchdayPoints = formatMatchdayPoints(group.matches)
        const matchdayLeader =
          group.matchday !== null ? formatMatchdayLeader(matchdayLeaders.get(group.matchday)) : null

        return (
          <section key={group.matchday ?? 'sin-fecha'} id={matchdaySectionId(group.matchday)}>
            <h2 className="font-display matchday-heading">
              {group.matchday !== null ? `Fecha ${group.matchday}` : 'Sin fecha asignada'}
              {matchdayPoints && <span className="matchday-points">{matchdayPoints}</span>}
              {matchdayLeader && <span className="matchday-leader">{matchdayLeader}</span>}
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
        )
      })}
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
  const [homeGoals, setHomeGoals] = useState(match.homeGoals !== null ? String(match.homeGoals) : '')
  const [awayGoals, setAwayGoals] = useState(match.awayGoals !== null ? String(match.awayGoals) : '')
  const [error, setError] = useState<string | null>(null)
  const [showGandalf, setShowGandalf] = useState(false)
  const now = useLiveNow(1000)

  const isFinished = match.matchStatus === 'finished'
  // Entre el kickoff y el resultado se ve editable, pero es una trampa: tocarlo saca a Gandalf.
  // Se cierra en vivo, sin recargar. La RLS aplica la misma regla en la base.
  const isLocked = isPredictionClosed(match, now)
  const closeGandalf = useCallback(() => setShowGandalf(false), [])

  function laughAtTheLateOne() {
    setHomeGoals(match.homeGoals !== null ? String(match.homeGoals) : '')
    setAwayGoals(match.awayGoals !== null ? String(match.awayGoals) : '')
    setShowGandalf(true)
  }

  async function saveIfComplete(nextHomeGoals: string, nextAwayGoals: string) {
    if (nextHomeGoals === '' || nextAwayGoals === '') return

    setError(null)

    try {
      await savePrediction({
        matchId: match.matchId,
        groupId,
        userId,
        homeGoals: Number(nextHomeGoals),
        awayGoals: Number(nextAwayGoals),
      })
      onSaved(match.matchId, Number(nextHomeGoals), Number(nextAwayGoals))
    } catch (err) {
      // Arrancó mientras tipeaba: la RLS lo rechazó, Gandalf lo explica mejor que el error crudo.
      if (isPredictionClosed(match)) {
        laughAtTheLateOne()
        return
      }
      setError(err instanceof Error ? err.message : 'No se pudo guardar el pronóstico')
    }
  }

  function handleHomeGoalsChange(event: { target: { value: string } }) {
    if (isLocked) return laughAtTheLateOne()
    const value = event.target.value
    setHomeGoals(value)
    void saveIfComplete(value, awayGoals)
  }

  function handleAwayGoalsChange(event: { target: { value: string } }) {
    if (isLocked) return laughAtTheLateOne()
    const value = event.target.value
    setAwayGoals(value)
    void saveIfComplete(homeGoals, value)
  }

  // readOnly evita que en el celular se abra el teclado; el click es el que dispara a Gandalf.
  const trapProps = isLocked ? { readOnly: true, onClick: laughAtTheLateOne } : {}

  const center = isFinished ? (
    <ReadOnlyPrediction match={match} />
  ) : (
    <div className="prediction-inline-edit">
      <input
        aria-label={`Goles local de ${match.homeTeam}`}
        type="number"
        value={homeGoals}
        onChange={handleHomeGoalsChange}
        {...trapProps}
      />
      <span>-</span>
      <input
        aria-label={`Goles visitante de ${match.awayTeam}`}
        type="number"
        value={awayGoals}
        onChange={handleAwayGoalsChange}
        {...trapProps}
      />
    </div>
  )

  const footer =
    error || showGandalf ? (
      <>
        {error && <p role="alert">{error}</p>}
        {showGandalf && <GandalfLaugh onClose={closeGandalf} />}
      </>
    ) : undefined

  return (
    <MatchCard
      id={`match-${match.matchId}`}
      homeTeam={match.homeTeam}
      homeTeamSlug={match.homeTeamSlug}
      awayTeam={match.awayTeam}
      awayTeamSlug={match.awayTeamSlug}
      center={center}
      footer={footer}
    />
  )
}
