export interface TabHrefs {
  pronosticos: string
  fixture: string
  tabla: string
  grupo: string
}

interface ResolveTabHrefsInput {
  activeGroupId: string | null
  soleActiveTournamentId: string | null
}

export function resolveTabHrefs({ activeGroupId, soleActiveTournamentId }: ResolveTabHrefsInput): TabHrefs {
  if (!activeGroupId) {
    return { pronosticos: '/', fixture: '/', tabla: '/', grupo: '/' }
  }

  const tournamentsHub = `/groups/${activeGroupId}/tournaments`

  return {
    pronosticos: tournamentsHub,
    fixture: soleActiveTournamentId ? `${tournamentsHub}/${soleActiveTournamentId}/history` : tournamentsHub,
    tabla: soleActiveTournamentId ? `${tournamentsHub}/${soleActiveTournamentId}/standings` : tournamentsHub,
    grupo: `/groups/${activeGroupId}/members`,
  }
}
