import { describe, expect, it } from 'vitest'
import { resolveTabHrefs } from './resolveTabHrefs'

describe('resolveTabHrefs', () => {
  it('manda todo a la pantalla de crear/unirse a un grupo cuando no hay grupo activo', () => {
    const hrefs = resolveTabHrefs({ activeGroupId: null, soleActiveTournamentId: null })

    expect(hrefs).toEqual({
      pronosticos: '/',
      fixture: '/',
      tabla: '/',
      grupo: '/',
    })
  })

  it('manda Fixture y Tabla al hub de torneos del grupo cuando no hay un unico torneo activo', () => {
    const hrefs = resolveTabHrefs({ activeGroupId: 'group-1', soleActiveTournamentId: null })

    expect(hrefs).toEqual({
      pronosticos: '/groups/group-1/tournaments',
      fixture: '/groups/group-1/tournaments',
      tabla: '/groups/group-1/tournaments',
      grupo: '/groups/group-1/members',
    })
  })

  it('manda Fixture y Tabla directo al torneo activo cuando hay exactamente uno', () => {
    const hrefs = resolveTabHrefs({ activeGroupId: 'group-1', soleActiveTournamentId: 'tournament-1' })

    expect(hrefs).toEqual({
      pronosticos: '/groups/group-1/tournaments',
      fixture: '/groups/group-1/tournaments/tournament-1/history',
      tabla: '/groups/group-1/tournaments/tournament-1/standings',
      grupo: '/groups/group-1/members',
    })
  })
})
