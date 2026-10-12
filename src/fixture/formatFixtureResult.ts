import type { FixtureMatch } from './fixtureService'

const MONTEVIDEO_TIME_ZONE = 'America/Montevideo'

function formatKickoff(kickoffAt: string): string {
  const date = new Date(kickoffAt)
  const formatter = new Intl.DateTimeFormat('es-UY', {
    timeZone: MONTEVIDEO_TIME_ZONE,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))

  return `${parts.day}/${parts.month}/${parts.year}, ${parts.hour}:${parts.minute}`
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
