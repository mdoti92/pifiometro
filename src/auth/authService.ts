import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthResult {
  user: User | null
  session: Session | null
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Ya existe una cuenta registrada con ese email')
    this.name = 'EmailAlreadyRegisteredError'
  }
}

function isDuplicateEmailError(message: string): boolean {
  return message.toLowerCase().includes('already registered')
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    if (isDuplicateEmailError(error.message)) {
      throw new EmailAlreadyRegisteredError()
    }
    throw new Error(error.message)
  }

  // Supabase responde 200 sin error pero con identities: [] cuando el email ya está registrado
  if (data.user && data.user.identities?.length === 0) {
    throw new EmailAlreadyRegisteredError()
  }

  return { user: data.user, session: data.session }
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(error.message)
  }

  return { user: data.user, session: data.session }
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })

  if (error) {
    throw new Error(error.message)
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}
