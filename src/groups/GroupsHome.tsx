import { useAuth } from '../auth/AuthContext'
import { usePushSubscriptionPrompt } from '../notifications/usePushSubscriptionPrompt'
import { CreateGroupForm } from './CreateGroupForm'
import { JoinGroupForm } from './JoinGroupForm'

export function GroupsHome() {
  const { user } = useAuth()
  usePushSubscriptionPrompt(user?.id)

  return (
    <div>
      <CreateGroupForm />
      <JoinGroupForm />
    </div>
  )
}
