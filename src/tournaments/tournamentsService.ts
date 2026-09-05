import { supabase } from '../lib/supabase'

export interface Tournament {
  id: string
  name: string
  season: string | null
}

export interface TournamentStage {
  id: string
  tournamentId: string
  name: string
  orderIndex: number
}

export async function isSuperadmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_superadmin')

  if (error) {
    throw new Error(error.message)
  }

  return Boolean(data)
}

export async function createTournament(
  name: string,
  season: string,
  stageNames: string[],
): Promise<Tournament> {
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .insert({ name, season })
    .select('id, name, season')
    .single()

  if (tournamentError) {
    throw new Error(tournamentError.message)
  }

  const stagesToInsert = stageNames.map((stageName, index) => ({
    tournament_id: tournament.id,
    name: stageName,
    order_index: index,
  }))

  const { error: stagesError } = await supabase.from('tournament_stages').insert(stagesToInsert)

  if (stagesError) {
    throw new Error(stagesError.message)
  }

  return { id: tournament.id, name: tournament.name, season: tournament.season }
}

export async function listTournamentStages(tournamentId: string): Promise<TournamentStage[]> {
  const { data, error } = await supabase
    .from('tournament_stages')
    .select('id, tournament_id, name, order_index')
    .eq('tournament_id', tournamentId)
    .order('order_index', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data.map((row) => ({
    id: row.id,
    tournamentId: row.tournament_id,
    name: row.name,
    orderIndex: row.order_index,
  }))
}

export async function renameStage(stageId: string, name: string): Promise<void> {
  const { error } = await supabase.from('tournament_stages').update({ name }).eq('id', stageId)

  if (error) {
    throw new Error(error.message)
  }
}
