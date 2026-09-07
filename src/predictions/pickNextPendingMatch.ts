import type { MatchPredictionStatus } from './myPredictionsService'

export function pickNextPendingMatch(
  statuses: MatchPredictionStatus[],
  now: Date,
): MatchPredictionStatus | null {
  const candidates = statuses.filter(
    (status) => status.status === 'pendiente' && new Date(status.kickoffAt).getTime() > now.getTime(),
  )

  if (candidates.length === 0) return null

  return candidates.reduce((earliest, candidate) =>
    new Date(candidate.kickoffAt) < new Date(earliest.kickoffAt) ? candidate : earliest,
  )
}
