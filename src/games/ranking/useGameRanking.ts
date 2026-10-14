import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import type { GameDefinition } from '../catalog'
import { addPendingResult, clearPendingResult, loadLocalRecord, loadPendingResult } from '../shared/localRecord'
import { fetchMyBest, submitGameResult } from './gameScoresService'
import { isBetter } from './rankingLogic'

export function useGameRanking(game: GameDefinition) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [remoteBest, setRemoteBest] = useState<number | null>(null)
  const { key, metric } = game

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function syncWithRemote(currentUserId: string) {
      let best = await fetchMyBest(currentUserId, key)

      const pending = loadPendingResult(key)
      if (pending !== null) {
        best = await submitGameResult(currentUserId, key, metric, pending)
        clearPendingResult(key)
      }

      // Récords jugados antes de que existiera el ranking: se suben una vez si superan la marca remota.
      const localRecord = metric === 'cumulative' ? null : loadLocalRecord(key)
      if (localRecord !== null && isBetter(metric, localRecord, best)) {
        best = await submitGameResult(currentUserId, key, metric, localRecord)
      }

      if (!cancelled) setRemoteBest(best)
    }

    syncWithRemote(userId).catch(() => {
      // Sin conexión: el juego sigue con el récord local y se reintenta la próxima vez que se abra.
    })

    return () => {
      cancelled = true
    }
  }, [userId, key, metric])

  const reportResult = useCallback(
    async (result: number) => {
      if (!userId) {
        addPendingResult(key, metric, result)
        return
      }

      try {
        setRemoteBest(await submitGameResult(userId, key, metric, result))
      } catch {
        addPendingResult(key, metric, result)
      }
    },
    [userId, key, metric],
  )

  return { remoteBest, reportResult }
}
