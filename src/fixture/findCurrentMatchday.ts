import type { MatchdayGroup } from './groupMatchesByMatchday'

/**
 * Fecha "actual": la primera que todavía tiene partidos por jugar.
 * Si ya se jugaron todas, la última.
 */
export function findCurrentMatchday<T>(
  groups: MatchdayGroup<T>[],
  isPending: (match: T) => boolean,
): number | null {
  const numberedGroups = groups.filter((group) => group.matchday !== null)
  const current = numberedGroups.find((group) => group.matches.some(isPending)) ?? numberedGroups.at(-1)

  return current?.matchday ?? null
}
