import { supabase } from '../lib/supabase'

export interface GroupMember {
  userId: string
  displayName: string | null
  role: 'admin' | 'member'
  joinedAt: string
}

// Sin tipos generados de Supabase, postgrest-js no puede inferir que
// profiles es un objeto (FK many-to-one) y no un array; el shape real
// en runtime es el de esta interfaz.
interface GroupMemberRow {
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  profiles: { display_name: string | null } | null
}

export async function listMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at, profiles(display_name)')
    .eq('group_id', groupId)

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as GroupMemberRow[]).map((row) => ({
    userId: row.user_id,
    displayName: row.profiles?.display_name ?? null,
    role: row.role,
    joinedAt: row.joined_at,
  }))
}

export async function isGroupAdmin(groupId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_group_admin', { p_group_id: groupId })

  if (error) {
    throw new Error(error.message)
  }

  return Boolean(data)
}

export async function removeMember(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function regenerateInviteCode(groupId: string): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_invite_code', { p_group_id: groupId })

  if (error) {
    throw new Error(error.message)
  }

  return data as string
}
