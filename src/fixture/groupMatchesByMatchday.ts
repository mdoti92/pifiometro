import type { FixtureMatch } from './fixtureService'

export interface MatchdayGroup {
  matchday: number | null
  matches: FixtureMatch[]
}

export function groupMatchesByMatchday(matches: FixtureMatch[]): MatchdayGroup[] {
  const matchesByMatchday = new Map<number | null, FixtureMatch[]>()

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
