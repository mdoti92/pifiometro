export function getRankChipColor(rank: number): string {
  if (rank === 1) return 'var(--moss)'
  if (rank === 2) return 'var(--gold)'
  return 'var(--rust)'
}
