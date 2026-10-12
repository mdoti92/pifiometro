const ORDINAL_LABELS: Record<number, string> = {
  1: '1ro',
  2: '2do',
  3: '3ro',
}

export function getOrdinalLabel(rank: number): string {
  return ORDINAL_LABELS[rank] ?? `${rank}°`
}
