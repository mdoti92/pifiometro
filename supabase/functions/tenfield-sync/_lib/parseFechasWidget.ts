import * as cheerio from 'cheerio'

export interface TenfieldMatch {
  homeTeamName: string
  awayTeamName: string
  kickoffAt: string
  homeGoals: number | null
  awayGoals: number | null
  status: 'scheduled' | 'finished'
}

export function parseFechasWidget(html: string): TenfieldMatch[] {
  const $ = cheerio.load(html)
  const matches: TenfieldMatch[] = []

  $('tr.sp-row.sp-post').each((_, row) => {
    const $row = $(row)
    const teamNames = $row
      .find('.sp-team-name')
      .map((_, el) => $(el).text().trim())
      .get()
    const [homeTeamName, awayTeamName] = teamNames
    if (!homeTeamName || !awayTeamName) return

    const kickoffAt = ($row.find('.sp-event-date').attr('datetime') ?? '').replace(' ', 'T')

    const resultSpans = $row
      .find('.sp-result')
      .map((_, el) => $(el).text().trim())
      .get()

    const played = resultSpans.length >= 2
    const homeGoals = played ? Number(resultSpans[0]) : null
    const awayGoals = played ? Number(resultSpans[1]) : null

    matches.push({
      homeTeamName,
      awayTeamName,
      kickoffAt,
      homeGoals: homeGoals !== null && Number.isNaN(homeGoals) ? null : homeGoals,
      awayGoals: awayGoals !== null && Number.isNaN(awayGoals) ? null : awayGoals,
      status: played ? 'finished' : 'scheduled',
    })
  })

  return matches
}
