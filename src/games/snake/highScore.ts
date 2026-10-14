export const HIGH_SCORE_STORAGE_KEY = 'pifiometro.games.snake.highScore'

export function loadHighScore(): number {
  const stored = Number(localStorage.getItem(HIGH_SCORE_STORAGE_KEY))
  return Number.isFinite(stored) && stored > 0 ? stored : 0
}

export function saveHighScoreIfBetter(score: number): number {
  const current = loadHighScore()
  if (score <= current) return current

  localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(score))
  return score
}
