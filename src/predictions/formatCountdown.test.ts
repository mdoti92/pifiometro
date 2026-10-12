import { describe, expect, it } from 'vitest'
import { formatCountdown, formatCountdownLabel } from './formatCountdown'

describe('formatCountdown', () => {
  it('descompone milisegundos en dias, horas, minutos y segundos', () => {
    const ms = (1 * 60 * 60 + 2 * 60 + 3) * 1000

    expect(formatCountdown(ms)).toEqual({ days: 0, hours: 1, minutes: 2, seconds: 3 })
  })

  it('devuelve todo en cero cuando faltan 0 ms', () => {
    expect(formatCountdown(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it('no devuelve valores negativos cuando el kickoff ya paso', () => {
    expect(formatCountdown(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it('convierte a dias cuando hay mas de 24 horas, dejando el resto en horas (0-23)', () => {
    const ms = 30 * 60 * 60 * 1000

    expect(formatCountdown(ms)).toEqual({ days: 1, hours: 6, minutes: 0, seconds: 0 })
  })

  it('soporta varios dias', () => {
    const ms = (4 * 24 + 20) * 60 * 60 * 1000 + 31 * 60 * 1000 + 6 * 1000

    expect(formatCountdown(ms)).toEqual({ days: 4, hours: 20, minutes: 31, seconds: 6 })
  })
})

describe('formatCountdownLabel', () => {
  it('rellena con cero a la izquierda horas, minutos y segundos de un digito', () => {
    expect(formatCountdownLabel({ days: 0, hours: 1, minutes: 2, seconds: 4 })).toBe('01h 02m 04s')
  })

  it('no muestra los dias cuando faltan menos de 24 horas', () => {
    expect(formatCountdownLabel({ days: 0, hours: 23, minutes: 59, seconds: 59 })).toBe('23h 59m 59s')
  })

  it('antepone los dias cuando hay uno o mas, sin rellenarlos con cero', () => {
    expect(formatCountdownLabel({ days: 4, hours: 20, minutes: 31, seconds: 6 })).toBe('4d 20h 31m 06s')
  })
})
