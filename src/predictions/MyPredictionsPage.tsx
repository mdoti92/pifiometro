import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { findLastFinishedMatchday } from '../fixture/findLastFinishedMatchday'
import { groupMatchesByMatchday } from '../fixture/groupMatchesByMatchday'
import { MatchCard } from '../matches/MatchCard'
import { listMatchPredictionStatuses, type MatchPredictionStatus } from './myPredictionsService'
import { PredictionHero } from './PredictionHero'

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
              <MatchCard
                key={match.matchId}
                homeTeam={match.homeTeam}
                homeTeamSlug={match.homeTeamSlug}
                awayTeam={match.awayTeam}
                awayTeamSlug={match.awayTeamSlug}
                center={STATUS_LABEL[match.status](match)}
                footer={
                  match.status !== 'no_pronosticado' && groupId ? (
                    <Link
                      to={`/groups/${groupId}/matches/${match.matchId}/predict`}
                      aria-label={`Cargar o editar pronóstico de ${match.homeTeam} vs ${match.awayTeam}`}
                    >
                      Cargar/editar
                    </Link>
                  ) : undefined
                }
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
