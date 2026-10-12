import { describe, expect, it } from 'vitest'
import { resolveTeamSlug } from './teamNameMapping'

describe('resolveTeamSlug', () => {
  it('resuelve el nombre exacto de un equipo a su slug', () => {
    expect(resolveTeamSlug('Liverpool')).toBe('liverpool')
  })

  it('resuelve el nombre corto "Defensor" al mismo slug que "Defensor Sporting"', () => {
    expect(resolveTeamSlug('Defensor')).toBe('defensor')
  })

  it('resuelve variantes de nombre del mismo equipo usadas en distintos widgets de tenfield', () => {
    expect(resolveTeamSlug('Montevideo City Torque')).toBe('torque')
    expect(resolveTeamSlug('MC Torque')).toBe('torque')
    expect(resolveTeamSlug('Torque')).toBe('torque')
  })

  it('devuelve null para un nombre sin mapeo conocido', () => {
    expect(resolveTeamSlug('Club Inexistente')).toBeNull()
  })

  it('ignora espacios sobrantes al resolver', () => {
    expect(resolveTeamSlug('  Nacional  ')).toBe('nacional')
  })
})
