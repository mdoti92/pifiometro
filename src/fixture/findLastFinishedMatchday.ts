import type { MatchdayGroup } from './groupMatchesByMatchday'

export function findLastFinishedMatchday<T>(
  groups: MatchdayGroup<T>[],
  isFinished: (match: T) => boolean,
): number | null {
  const finishedMatchdays = groups
    .filter((group) => group.matchday !== null && group.matches.some(isFinished))
    .map((group) => group.matchday as number)

  return finishedMatchdays.length === 0 ? null : Math.max(...finishedMatchdays)
}
