import { describe, expect, it } from 'vitest'
import { getTeamBadgeColor, getTeamInitials } from './teamBadgeHelpers'

describe('getTeamInitials', () => {
  it('toma la primera letra de cada palabra, hasta 3, para nombres de varias palabras', () => {
    expect(getTeamInitials('Deportivo Maldonado')).toBe('DM')
    expect(getTeamInitials('Central Español')).toBe('CE')
  })

  it('toma las primeras 2 letras cuando el nombre es una sola palabra', () => {
    expect(getTeamInitials('Danubio')).toBe('DA')
    expect(getTeamInitials('Nacional')).toBe('NA')
  })

  it('recorta a 3 iniciales cuando hay mas de 3 palabras', () => {
    expect(getTeamInitials('Club Atletico River Plate')).toBe('CAR')
  })

  it('ignora espacios repetidos', () => {
    expect(getTeamInitials('  Boston   River  ')).toBe('BR')
  })
})

describe('getTeamBadgeColor', () => {
  it('devuelve siempre uno de los tres colores del sistema de diseno', () => {
    const allowed = ['var(--hearth)', 'var(--moss)', 'var(--steel)']

    expect(allowed).toContain(getTeamBadgeColor('danubio'))
    expect(allowed).toContain(getTeamBadgeColor('nacional'))
    expect(allowed).toContain(getTeamBadgeColor('penarol'))
  })

  it('es deterministico: el mismo slug siempre da el mismo color', () => {
    expect(getTeamBadgeColor('danubio')).toBe(getTeamBadgeColor('danubio'))
  })
})
