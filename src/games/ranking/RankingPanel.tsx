import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { formatGameValue, type GameDefinition } from '../catalog'
import { fetchGameScores } from './gameScoresService'
import { buildRanking, type Ranking, type RankingEntry } from './rankingLogic'

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; ranking: Ranking }

interface RankingPanelProps {
  game: GameDefinition
  onClose: () => void
}

function RankingRow({ entry, game }: { entry: RankingEntry; game: GameDefinition }) {
  return (
    <tr className={entry.isCurrentUser ? 'is-current-user' : undefined}>
      <td>{entry.position}°</td>
      <td>{entry.displayName ?? 'Sin nombre'}</td>
      <td>{formatGameValue(game, entry.value)}</td>
    </tr>
  )
}

export function RankingPanel({ game, onClose }: RankingPanelProps) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetchGameScores(game.key)
      .then((rows) => {
        if (!cancelled) setState({ status: 'ready', ranking: buildRanking(game.metric, rows, userId) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [game.key, game.metric, userId])

  return (
    <div className="ranking-panel" role="dialog" aria-label={`Ranking de ${game.name}`}>
      <header className="ranking-panel-header">
        <h2>Ranking · {game.name}</h2>
        <button type="button" onClick={onClose}>
          Cerrar
        </button>
      </header>

      {state.status === 'loading' && <p>Cargando…</p>}
      {state.status === 'error' && <p>No se pudo cargar el ranking. Probá de nuevo más tarde.</p>}
      {state.status === 'ready' && state.ranking.top.length === 0 && <p>Todavía no hay puntajes en este juego.</p>}
      {state.status === 'ready' && state.ranking.top.length > 0 && (
        <table className="standings-table ranking-table">
          <thead>
            <tr>
              <th>Posición</th>
              <th>Jugador</th>
              <th>Marca</th>
            </tr>
          </thead>
          <tbody>
            {state.ranking.top.map((entry) => (
              <RankingRow key={entry.userId} entry={entry} game={game} />
            ))}
          </tbody>
        </table>
      )}
      {state.status === 'ready' && state.ranking.currentUserOutsideTop && (
        <p className="ranking-current-user" data-testid="ranking-current-user">
          {state.ranking.currentUserOutsideTop.position}° {state.ranking.currentUserOutsideTop.displayName ?? 'Vos'} ·{' '}
          {formatGameValue(game, state.ranking.currentUserOutsideTop.value)}
        </p>
      )}
    </div>
  )
}
