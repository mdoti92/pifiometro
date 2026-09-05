import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  createMatch,
  editMatch,
  MatchNotFoundError,
  type MatchesAdminClient,
  NotSuperadminError,
} from './_lib/matchesAdmin.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

// deno-lint-ignore no-explicit-any
function toRow(input: Record<string, any>) {
  const row: Record<string, unknown> = {}
  if ('tournamentId' in input) row.tournament_id = input.tournamentId
  if ('stageId' in input) row.stage_id = input.stageId
  if ('homeTeam' in input) row.home_team = input.homeTeam
  if ('awayTeam' in input) row.away_team = input.awayTeam
  if ('kickoffAt' in input) row.kickoff_at = input.kickoffAt
  if ('isElimination' in input) row.is_elimination = input.isElimination
  if ('source' in input) row.source = input.source
  return row
}

// deno-lint-ignore no-explicit-any
function fromRow(row: any) {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    stageId: row.stage_id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    kickoffAt: row.kickoff_at,
    isElimination: row.is_elimination,
    source: row.source,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await authClient.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey, { db: { schema: 'pifiometro' } })

  const client: MatchesAdminClient = {
    async isSuperadmin(userId) {
      const { data, error } = await admin
        .from('profiles')
        .select('is_superadmin')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return Boolean(data?.is_superadmin)
    },
    async insertMatch(data) {
      const { data: row, error } = await admin.from('matches').insert(toRow(data)).select().single()
      if (error) throw new Error(error.message)
      return fromRow(row)
    },
    async updateMatch(matchId, data) {
      const { data: row, error } = await admin
        .from('matches')
        .update(toRow(data))
        .eq('id', matchId)
        .select()
        .maybeSingle()
      if (error) throw new Error(error.message)
      return row ? fromRow(row) : null
    },
  }

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/matches-admin/, '')

  try {
    if (req.method === 'POST' && path === '') {
      const body = await req.json()
      const match = await createMatch(client, userData.user.id, body)
      return json(match, 201)
    }

    const editMatchPath = path.match(/^\/([^/]+)$/)
    if (req.method === 'PATCH' && editMatchPath) {
      const body = await req.json()
      const match = await editMatch(client, userData.user.id, editMatchPath[1], body)
      return json(match)
    }

    return json({ error: 'Not Found' }, 404)
  } catch (err) {
    if (err instanceof NotSuperadminError) return json({ error: err.message }, 403)
    if (err instanceof MatchNotFoundError) return json({ error: err.message }, 404)
    return json({ error: (err as Error).message }, 400)
  }
})
