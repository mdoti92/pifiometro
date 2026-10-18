import { supabase } from '../lib/supabase'

export async function fetchMyDisplayName(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle()

  if (error) throw new Error(error.message)
  return (data as { display_name: string | null } | null)?.display_name ?? null
}

export async function saveMyDisplayName(userId: string, displayName: string): Promise<void> {
  const trimmed = displayName.trim()
  if (trimmed === '') throw new Error('El nombre no puede estar vacío')

  const { error } = await supabase.from('profiles').update({ display_name: trimmed }).eq('id', userId)

  if (error) throw new Error(error.message)
}
