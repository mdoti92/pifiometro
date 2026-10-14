export const RANKING_TOP_SIZE = 10

/**
 * highest: gana el mayor (puntaje). lowest: gana el menor (tiempo).
 * cumulative: cada resultado se suma a lo acumulado (partidos ganados) y gana el mayor.
 */
export type GameMetric = 'highest' | 'lowest' | 'cumulative'

export interface ScoreRow {
  userId: string
  displayName: string | null
  value: number
  achievedAt: string
}

export interface RankingEntry extends ScoreRow {
  position: number
  isCurrentUser: boolean
}

export interface Ranking {
  top: RankingEntry[]
  currentUserOutsideTop: RankingEntry | null
}

export function isBetter(metric: GameMetric, candidate: number, current: number | null): boolean {
  if (current === null) return true
  return metric === 'lowest' ? candidate < current : candidate > current
}

/** Devuelve el nuevo valor a guardar, o null si el resultado no cambia la marca. */
export function mergeResult(metric: GameMetric, current: number | null, result: number): number | null {
  if (metric === 'cumulative') return result > 0 ? (current ?? 0) + result : null
  return isBetter(metric, result, current) ? result : null
}

function compareRows(metric: GameMetric) {
  return (a: ScoreRow, b: ScoreRow) => {
    if (a.value !== b.value) return metric === 'lowest' ? a.value - b.value : b.value - a.value
    return Date.parse(a.achievedAt) - Date.parse(b.achievedAt)
  }
}

export function buildRanking(metric: GameMetric, rows: ScoreRow[], currentUserId: string | null): Ranking {
  const entries = [...rows].sort(compareRows(metric)).map((row, index) => ({
    ...row,
    position: index + 1,
    isCurrentUser: row.userId === currentUserId,
  }))

  const top = entries.slice(0, RANKING_TOP_SIZE)
  const currentUser = entries.find((entry) => entry.isCurrentUser) ?? null
  const currentUserOutsideTop = currentUser && currentUser.position > RANKING_TOP_SIZE ? currentUser : null

  return { top, currentUserOutsideTop }
}
