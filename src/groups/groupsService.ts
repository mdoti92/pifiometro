import { supabase } from '../lib/supabase'

export interface Group {
  id: string
  name: string
  inviteCode: string
  createdBy: string
  createdAt: string
}

export class GroupNameRequiredError extends Error {
  constructor() {
    super('El nombre del grupo es obligatorio')
    this.name = 'GroupNameRequiredError'
  }
}

export async function createGroup(name: string, createdBy: string): Promise<Group> {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new GroupNameRequiredError()
  }

  const { data, error } = await supabase
    .from('groups')
    .insert({ name: trimmedName, created_by: createdBy })
    .select('id, name, invite_code, created_by, created_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    name: data.name,
    inviteCode: data.invite_code,
    createdBy: data.created_by,
    createdAt: data.created_at,
  }
}

export interface MyGroup {
  id: string
  name: string
}

// Sin tipos generados de Supabase, postgrest-js no puede inferir que
// groups es un objeto (FK many-to-one) y no un array; el shape real
// en runtime es el de esta interfaz.
interface MyGroupRow {
  group_id: string
  groups: { id: string; name: string } | null
}

export async function listMyGroups(userId: string): Promise<MyGroup[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name)')
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as MyGroupRow[])
    .filter((row) => row.groups !== null)
    .map((row) => ({ id: row.groups!.id, name: row.groups!.name }))
}

export async function joinGroup(inviteCode: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_group', { p_invite_code: inviteCode.trim() })

  if (error) {
    throw new Error(error.message)
  }

  return data as string
}
