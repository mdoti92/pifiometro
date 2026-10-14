import { PALETTES, type PaletteKey } from '../design/palettes'
import { supabase } from '../lib/supabase'

function isPaletteKey(value: unknown): value is PaletteKey {
  return PALETTES.some((palette) => palette.key === value)
}

export async function fetchMyPalette(userId: string): Promise<PaletteKey | null> {
  const { data, error } = await supabase.from('profiles').select('palette').eq('id', userId).maybeSingle()

  if (error) throw new Error(error.message)
  const palette = (data as { palette: string } | null)?.palette
  return isPaletteKey(palette) ? palette : null
}

export async function saveMyPalette(userId: string, palette: PaletteKey): Promise<void> {
  const { error } = await supabase.from('profiles').update({ palette }).eq('id', userId)

  if (error) throw new Error(error.message)
}
