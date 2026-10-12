import { describe, expect, it } from 'vitest'
import { getPredictionStatusColor } from './predictionStatusColor'

describe('getPredictionStatusColor', () => {
  it('mapea exacto al color hearth', () => {
    expect(getPredictionStatusColor('exacto')).toBe('var(--hearth)')
  })

  it('mapea resultado al color moss', () => {
    expect(getPredictionStatusColor('resultado')).toBe('var(--moss)')
  })

  it('mapea pifiado al color rust', () => {
    expect(getPredictionStatusColor('pifiado')).toBe('var(--rust)')
  })

  it('mapea por_definir al color steel', () => {
    expect(getPredictionStatusColor('por_definir')).toBe('var(--steel)')
  })

  it('mapea no_pronosticado al color steel', () => {
    expect(getPredictionStatusColor('no_pronosticado')).toBe('var(--steel)')
  })
})
