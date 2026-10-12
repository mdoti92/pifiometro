import { describe, expect, it } from 'vitest'
import { formatCountdown } from './formatCountdown'

describe('formatCountdown', () => {
  it('descompone milisegundos en horas, minutos y segundos', () => {
    const ms = (1 * 60 * 60 + 2 * 60 + 3) * 1000

    expect(formatCountdown(ms)).toEqual({ hours: 1, minutes: 2, seconds: 3 })
  })

  it('devuelve todo en cero cuando faltan 0 ms', () => {
    expect(formatCountdown(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 })
  })

  it('no devuelve valores negativos cuando el kickoff ya paso', () => {
    expect(formatCountdown(-5000)).toEqual({ hours: 0, minutes: 0, seconds: 0 })
  })

  it('soporta mas de 24 horas sin acotar el campo de horas', () => {
    const ms = 30 * 60 * 60 * 1000

    expect(formatCountdown(ms)).toEqual({ hours: 30, minutes: 0, seconds: 0 })
  })
})
