import { supabase } from '../../lib/supabase'
import { mergeResult, type GameMetric, type ScoreRow } from './rankingLogic'

interface GameScoreRecord {
  user_id: string
  best_value: number
  achieved_at: string
  profiles: { display_name: string | null } | null
}

export async function fetchGameScores(gameKey: string): Promise<ScoreRow[]> {
  const { data, error } = await supabase
    .from('game_scores')
    .select('user_id, best_value, achieved_at, profiles(display_name)')
    .eq('game_key', gameKey)

  if (error) throw new Error(error.message)

  return (data as unknown as GameScoreRecord[]).map((record) => ({
    userId: record.user_id,
    displayName: record.profiles?.display_name ?? null,
    value: record.best_value,
    achievedAt: record.achieved_at,
  }))
}

export async function fetchMyBest(userId: string, gameKey: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('game_scores')
    .select('best_value')
    .eq('user_id', userId)
    .eq('game_key', gameKey)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as { best_value: number } | null)?.best_value ?? null
}

/** Guarda el resultado si cambia la marca del usuario y devuelve su marca vigente. */
export async function submitGameResult(
  userId: string,
  gameKey: string,
  metric: GameMetric,
  result: number,
): Promise<number> {
  const current = await fetchMyBest(userId, gameKey)
  const next = mergeResult(metric, current, result)
  if (next === null) return current ?? result

  const { error } = await supabase
    .from('game_scores')
    .upsert(
      { user_id: userId, game_key: gameKey, best_value: next, achieved_at: new Date().toISOString() },
      { onConflict: 'user_id,game_key' },
    )

  if (error) throw new Error(error.message)
  return next
}
