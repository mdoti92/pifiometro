import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { resolveTabHrefs } from '../nav/resolveTabHrefs'
import { useActiveGroup } from '../nav/useActiveGroup'
import { usePushSubscriptionPrompt } from '../notifications/usePushSubscriptionPrompt'
import { CreateGroupForm } from './CreateGroupForm'
import { listGroupTournaments, pickSoleActiveTournament } from './groupTournamentsService'
import { listMyGroups, type MyGroup } from './groupsService'
import { JoinGroupForm } from './JoinGroupForm'

const NO_GROUPS: MyGroup[] = []

export function GroupsHome() {
  const { user } = useAuth()
  usePushSubscriptionPrompt(user?.id)
  const [groups, setGroups] = useState<MyGroup[] | null>(null)
  const { activeGroupId } = useActiveGroup(groups ?? NO_GROUPS)
  const [homeHref, setHomeHref] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    listMyGroups(user.id).then(setGroups)
  }, [user])

  useEffect(() => {
    if (!activeGroupId) return

    listGroupTournaments(activeGroupId).then((groupTournaments) => {
      const soleActiveTournamentId = pickSoleActiveTournament(groupTournaments)?.tournamentId ?? null
      setHomeHref(resolveTabHrefs({ activeGroupId, soleActiveTournamentId }).tabla)
    })
  }, [activeGroupId])

  if (groups === null) return null

  if (activeGroupId) {
    return homeHref ? <Navigate to={homeHref} replace /> : null
  }

  return (
    <div>
      <CreateGroupForm />
      <JoinGroupForm />
    </div>
  )
}
