import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildFechasWidgetUrl } from './_lib/buildFechasWidgetUrl.ts'
import { parseFechasWidget } from './_lib/parseFechasWidget.ts'
import { type SyncMatchesClient, syncTenfieldMatches } from './_lib/syncTenfieldMatches.ts'

// id interno del widget de fechas del Campeonato Uruguayo en estadisticas.tenfield.com.uy.
const CAMPEONATO_URUGUAYO_FECHAS_WIDGET_ID = '11918'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceRoleKey, { db: { schema: 'pifiometro' } })

  try {
    const { data: stage, error: stageError } = await admin
      .from('tournament_stages')
      .select('id')
      .eq('is_current', true)
      .single()
    if (stageError) throw new Error(`No se pudo resolver la etapa activa: ${stageError.message}`)

    const { data: matchdayRange, error: rangeError } = await admin
      .from('matches')
      .select('matchday')
      .eq('stage_id', stage.id)
      .not('matchday', 'is', null)
    if (rangeError) throw new Error(`No se pudo resolver el rango de fechas: ${rangeError.message}`)

    const matchdays = matchdayRange.map((row: { matchday: number }) => row.matchday)
    if (matchdays.length === 0) {
      return json({ ok: true, message: 'La etapa activa no tiene partidos cargados, nada para sincronizar.' })
    }
    const totalFechas = Math.max(...matchdays) - Math.min(...matchdays) + 1

    const widgetUrl = buildFechasWidgetUrl({
      widgetId: CAMPEONATO_URUGUAYO_FECHAS_WIDGET_ID,
      totalFechas,
    })
    const widgetResponse = await fetch(widgetUrl, {
      headers: { 'User-Agent': 'PifiometroSync/1.0 (+mdoti92@gmail.com)' },
    })
    if (!widgetResponse.ok) {
      throw new Error(`GET ${widgetUrl} devolvio ${widgetResponse.status}`)
    }
    const html = await widgetResponse.text()
    const tenfieldMatches = parseFechasWidget(html)

    const { data: teams, error: teamsError } = await admin.from('teams').select('id, slug')
    if (teamsError) throw new Error(`No se pudo leer pifiometro.teams: ${teamsError.message}`)
    const teamIdBySlug = new Map(teams.map((team: { id: string; slug: string }) => [team.slug, team.id]))

    const client: SyncMatchesClient = {
      resolveTeamId(slug) {
        return Promise.resolve(teamIdBySlug.get(slug) ?? null)
      },
      async findMatch(stageId, homeTeamId, awayTeamId) {
        const { data, error } = await admin
          .from('matches')
          .select('id')
          .eq('stage_id', stageId)
          .eq('home_team_id', homeTeamId)
          .eq('away_team_id', awayTeamId)
          .maybeSingle()
        if (error) throw new Error(error.message)
        return data
      },
      async updateMatch(matchId, data) {
        const row: Record<string, unknown> = { kickoff_at: data.kickoffAt }
        if ('homeGoals' in data) row.home_goals = data.homeGoals
        if ('awayGoals' in data) row.away_goals = data.awayGoals
        if ('status' in data) row.status = data.status

        const { error } = await admin.from('matches').update(row).eq('id', matchId)
        if (error) throw new Error(error.message)
      },
    }

    const result = await syncTenfieldMatches(client, stage.id, tenfieldMatches)
    return json({ ok: true, ...result })
  } catch (err) {
    console.error('tenfield-sync fallo:', err)
    return json({ ok: false, error: (err as Error).message }, 500)
  }
})
