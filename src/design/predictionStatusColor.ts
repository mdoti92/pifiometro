export type PredictionResultStatus = 'exacto' | 'resultado' | 'pifiado' | 'por_definir' | 'no_pronosticado'

const STATUS_COLOR: Record<PredictionResultStatus, string> = {
  exacto: 'var(--hearth)',
  resultado: 'var(--moss)',
  pifiado: 'var(--rust)',
  por_definir: 'var(--steel)',
  no_pronosticado: 'var(--steel)',
}

export function getPredictionStatusColor(status: PredictionResultStatus): string {
  return STATUS_COLOR[status]
}
