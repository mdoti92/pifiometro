import { useEffect } from 'react'
import type { GameDefinition } from '../catalog'
import { isBetter } from '../ranking/rankingLogic'
import { useGameRanking } from '../ranking/useGameRanking'
import { loadLocalRecord, saveLocalRecordIfBetter } from './localRecord'

function bestOf(game: GameDefinition, a: number | null, b: number | null): number | null {
  if (a === null) return b
  if (b === null) return a
  const metric = game.metric === 'cumulative' ? 'highest' : game.metric
  return isBetter(metric, a, b) ? a : b
}

interface GameRecordOptions {
  /** Una partida terminada que no cuenta como marca (ej. perder en Buscaminas). */
  skipReport?: boolean
}

/**
 * Récord de un juego: al terminar cada partida guarda el resultado en el dispositivo y lo reporta al ranking.
 * El récord que se muestra es el mejor entre el local y el del ranking.
 */
export function useGameRecord(game: GameDefinition, finished: boolean, result: number, options: GameRecordOptions = {}) {
  const { remoteBest, reportResult } = useGameRanking(game)
  const counts = finished && !options.skipReport
  const { key, metric } = game

  useEffect(() => {
    if (!counts) return
    saveLocalRecordIfBetter(key, metric, result)
    reportResult(result)
    // Se reporta una vez al terminar cada partida; el resultado no cambia mientras está terminada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts])

  // Se lee en cada render para reflejar lo que el efecto guardó al terminar la partida anterior.
  const localRecord = loadLocalRecord(key)
  const justFinished = counts && metric !== 'cumulative' ? result : null
  const record = bestOf(game, bestOf(game, localRecord, justFinished), remoteBest)

  return { record }
}
