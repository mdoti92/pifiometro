import { describe, expect, it } from 'vitest'
import { getPredictionStatusColor } from './predictionStatusColor'

describe('getPredictionStatusColor', () => {
  it('mapea exacto a su token de estado', () => {
    expect(getPredictionStatusColor('exacto')).toBe('var(--exacto)')
  })

  it('mapea resultado a su token de estado', () => {
    expect(getPredictionStatusColor('resultado')).toBe('var(--resultado)')
  })

  it('mapea pifiado a su token de estado', () => {
    expect(getPredictionStatusColor('pifiado')).toBe('var(--pifiado)')
  })

  it('mapea por_definir al color steel', () => {
    expect(getPredictionStatusColor('por_definir')).toBe('var(--steel)')
  })

  it('mapea no_pronosticado al color steel', () => {
    expect(getPredictionStatusColor('no_pronosticado')).toBe('var(--steel)')
  })
})
