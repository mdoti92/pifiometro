import { describe, expect, it } from 'vitest'
import { getRankChipColor } from './rankChipColor'

describe('getRankChipColor', () => {
  it('mapea el primer puesto al color moss (verde)', () => {
    expect(getRankChipColor(1)).toBe('var(--moss)')
  })

  it('mapea el segundo puesto al color gold (amarillo)', () => {
    expect(getRankChipColor(2)).toBe('var(--gold)')
  })

  it('mapea el tercer puesto al color rust (rojo)', () => {
    expect(getRankChipColor(3)).toBe('var(--rust)')
  })

  it('mapea cualquier puesto peor que el tercero tambien a rust', () => {
    expect(getRankChipColor(4)).toBe('var(--rust)')
  })
})
