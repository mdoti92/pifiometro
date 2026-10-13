export interface TabHrefs {
  pronosticos: string
  fixture: string
  tabla: string
}

interface ResolveTabHrefsInput {
  activeGroupId: string | null
  soleActiveTournamentId: string | null
  currentStageId?: string | null
}

export function resolveTabHrefs({
  activeGroupId,
  soleActiveTournamentId,
  currentStageId,
}: ResolveTabHrefsInput): TabHrefs {
  if (!activeGroupId) {
    return { pronosticos: '/', fixture: '/', tabla: '/' }
  }

  const tournamentsHub = `/groups/${activeGroupId}/tournaments`
  const hasCurrentStage = Boolean(soleActiveTournamentId && currentStageId)

  return {
    pronosticos: hasCurrentStage
      ? `/groups/${activeGroupId}/stages/${currentStageId}/predictions`
      : tournamentsHub,
    fixture: `/groups/${activeGroupId}/fixture`,
    tabla: soleActiveTournamentId ? `${tournamentsHub}/${soleActiveTournamentId}/standings` : tournamentsHub,
  }
}
