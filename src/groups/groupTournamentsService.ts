import { supabase } from '../lib/supabase'

export interface Tournament {
  id: string
  name: string
  season: string | null
}

export interface GroupTournament {
  tournamentId: string
  name: string
  season: string | null
  active: boolean
}

// Sin tipos generados de Supabase, postgrest-js no puede inferir que
// tournaments es un objeto (FK many-to-one) y no un array; el shape real
// en runtime es el de esta interfaz.
interface GroupTournamentRow {
  tournament_id: string
  active: boolean
  tournaments: { name: string; season: string | null } | null
}

export async function listAvailableTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('id, name, season')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function listGroupTournaments(groupId: string): Promise<GroupTournament[]> {
  const { data, error } = await supabase
    .from('group_tournaments')
    .select('tournament_id, active, tournaments(name, season)')
    .eq('group_id', groupId)

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as GroupTournamentRow[]).map((row) => ({
    tournamentId: row.tournament_id,
    name: row.tournaments?.name ?? '',
    season: row.tournaments?.season ?? null,
    active: row.active,
  }))
}

export async function activateTournament(groupId: string, tournamentId: string): Promise<void> {
  const { error } = await supabase
    .from('group_tournaments')
    .upsert(
      { group_id: groupId, tournament_id: tournamentId, active: true },
      { onConflict: 'group_id,tournament_id' },
    )

  if (error) {
    throw new Error(error.message)
  }
}

export async function deactivateTournament(groupId: string, tournamentId: string): Promise<void> {
  const { error } = await supabase
    .from('group_tournaments')
    .update({ active: false })
    .eq('group_id', groupId)
    .eq('tournament_id', tournamentId)

  if (error) {
    throw new Error(error.message)
  }
}
