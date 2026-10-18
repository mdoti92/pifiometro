import { supabase } from '../lib/supabase'

export const PRIVATE_APP_MESSAGE = 'Esta app es privada. Si crees que deberías tener acceso, escribile a Martin.'

/**
 * Whitelist propia de Pifiómetro (pifiometro.allowed_emails). Los hooks de auth del proyecto son compartidos con
 * Palantír y Bree y aceptan la whitelist de cualquiera de las apps, así que el acceso a Pifiómetro se valida acá
 * y en las policies de RLS.
 */
export async function isAllowed(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_allowed')
  if (error) throw new Error('No se pudo verificar el acceso. Probá de nuevo.')
  return data === true
}
