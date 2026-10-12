import { supabase } from '../lib/supabase'

export interface Team {
  id: string
  name: string
  alias: string | null
  slug: string
}

export async function listTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, alias, slug')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export function getTeamDisplayName(
  team: { name: string; alias: string | null } | null | undefined,
): string {
  if (!team) return ''
  return team.alias ?? team.name
}
