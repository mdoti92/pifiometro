import { type ReactNode, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { listGroupTournaments, pickSoleActiveTournament } from '../groups/groupTournamentsService'
import { listMyGroups, type MyGroup } from '../groups/groupsService'
import { BottomNav } from './BottomNav'
import { GroupSelector } from './GroupSelector'
import { resolveTabHrefs } from './resolveTabHrefs'
import { useActiveGroup } from './useActiveGroup'

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [groups, setGroups] = useState<MyGroup[]>([])
  const { activeGroupId, setActiveGroupId } = useActiveGroup(groups)
  const [soleActiveTournamentId, setSoleActiveTournamentId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    listMyGroups(user.id).then(setGroups)
  }, [user])

  useEffect(() => {
    if (!activeGroupId) return

    listGroupTournaments(activeGroupId).then((groupTournaments) => {
      setSoleActiveTournamentId(pickSoleActiveTournament(groupTournaments)?.tournamentId ?? null)
    })
  }, [activeGroupId])

  const hrefs = resolveTabHrefs({ activeGroupId, soleActiveTournamentId })

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <GroupSelector groups={groups} activeGroupId={activeGroupId ?? ''} onChange={setActiveGroupId} />
      </header>

      <main className="app-shell-content">{children}</main>

      <BottomNav hrefs={hrefs} />
    </div>
  )
}
