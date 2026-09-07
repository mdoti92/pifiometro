import type { FixtureMatch } from './fixtureService'

function formatKickoff(kickoffAt: string): string {
  const date = new Date(kickoffAt)
  const day = date.getUTCDate()
  const month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear()
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')

  return `${day}/${month}/${year}, ${hours}:${minutes}`
}

export function formatFixtureResult(match: FixtureMatch): string {
  if (match.status === 'postponed') {
    return 'Postergado'
  }

  if (match.status !== 'finished') {
    return formatKickoff(match.kickoffAt)
  }

  const regulationResult = `${match.homeGoals}-${match.awayGoals}`

  if (!match.wentToPenalties) {
    return regulationResult
  }

  return `${regulationResult} (penales ${match.homeGoalsPenalties}-${match.awayGoalsPenalties})`
}
