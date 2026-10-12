import { describe, expect, it } from 'vitest'
import { getOrdinalLabel } from './ordinalLabel'

describe('getOrdinalLabel', () => {
  it('abrevia el primer puesto como 1ro', () => {
    expect(getOrdinalLabel(1)).toBe('1ro')
  })

  it('abrevia el segundo puesto como 2do', () => {
    expect(getOrdinalLabel(2)).toBe('2do')
  })

  it('abrevia el tercer puesto como 3ro', () => {
    expect(getOrdinalLabel(3)).toBe('3ro')
  })

  it('usa el formato generico N° para puestos sin abreviatura conocida', () => {
    expect(getOrdinalLabel(4)).toBe('4°')
  })
})
