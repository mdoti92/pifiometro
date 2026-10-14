import { mergeResult, type GameMetric } from '../ranking/rankingLogic'

const STORAGE_PREFIX = 'pifiometro.games'

export function localRecordStorageKey(gameKey: string): string {
  return `${STORAGE_PREFIX}.${gameKey}.highScore`
}

function pendingStorageKey(gameKey: string): string {
  return `${STORAGE_PREFIX}.${gameKey}.pendingResult`
}

function readNumber(key: string): number | null {
  const raw = localStorage.getItem(key)
  if (raw === null) return null
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : null
}

function mergeAndStore(key: string, metric: GameMetric, result: number): number {
  const current = readNumber(key)
  const next = mergeResult(metric, current, result)
  if (next === null) return current ?? result
  localStorage.setItem(key, String(next))
  return next
}

export function loadLocalRecord(gameKey: string): number | null {
  return readNumber(localRecordStorageKey(gameKey))
}

export function saveLocalRecordIfBetter(gameKey: string, metric: GameMetric, result: number): number {
  return mergeAndStore(localRecordStorageKey(gameKey), metric, result)
}

export function loadPendingResult(gameKey: string): number | null {
  return readNumber(pendingStorageKey(gameKey))
}

export function addPendingResult(gameKey: string, metric: GameMetric, result: number): void {
  mergeAndStore(pendingStorageKey(gameKey), metric, result)
}

export function clearPendingResult(gameKey: string): void {
  localStorage.removeItem(pendingStorageKey(gameKey))
}
