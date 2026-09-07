const BADGE_COLORS = ['var(--hearth)', 'var(--moss)', 'var(--steel)']
const MAX_INITIALS_WORDS = 3
const SINGLE_WORD_LETTERS = 2

export function getTeamInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)

  if (words.length === 1) {
    return words[0].slice(0, SINGLE_WORD_LETTERS).toUpperCase()
  }

  return words
    .slice(0, MAX_INITIALS_WORDS)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export function getTeamBadgeColor(slug: string): string {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) % BADGE_COLORS.length
  }

  return BADGE_COLORS[hash]
}
