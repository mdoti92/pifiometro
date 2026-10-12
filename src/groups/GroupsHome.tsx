import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { usePushSubscriptionPrompt } from '../notifications/usePushSubscriptionPrompt'
import { CreateGroupForm } from './CreateGroupForm'
import { listMyGroups } from './groupsService'
import { JoinGroupForm } from './JoinGroupForm'

export function GroupsHome() {
  const { user } = useAuth()
  usePushSubscriptionPrompt(user?.id)
  const [checked, setChecked] = useState(false)
  const [myGroupId, setMyGroupId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    listMyGroups(user.id).then((groups) => {
      setMyGroupId(groups[0]?.id ?? null)
      setChecked(true)
    })
  }, [user])

  if (!checked) return null

  if (myGroupId) {
    return <Navigate to={`/groups/${myGroupId}/tournaments`} replace />
  }

  return (
    <div>
      <CreateGroupForm />
      <JoinGroupForm />
    </div>
  )
}
