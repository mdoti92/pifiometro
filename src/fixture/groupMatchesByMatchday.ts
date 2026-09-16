export interface MatchdayGroup<T> {
  matchday: number | null
  matches: T[]
}

export function groupMatchesByMatchday<T extends { matchday: number | null }>(
  matches: T[],
): MatchdayGroup<T>[] {
  const matchesByMatchday = new Map<number | null, T[]>()

  for (const match of matches) {
    const bucket = matchesByMatchday.get(match.matchday) ?? []
    bucket.push(match)
    matchesByMatchday.set(match.matchday, bucket)
  }

  return [...matchesByMatchday.entries()]
    .map(([matchday, groupMatches]) => ({ matchday, matches: groupMatches }))
    .sort((a, b) => {
      if (a.matchday === null) return 1
      if (b.matchday === null) return -1
      return a.matchday - b.matchday
    })
}
