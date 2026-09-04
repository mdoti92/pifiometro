import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  type GroupMember,
  isGroupAdmin,
  listMembers,
  regenerateInviteCode,
  removeMember,
} from './groupMembersService'

export function MembersPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [admin, setAdmin] = useState<boolean | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId) return

    isGroupAdmin(groupId).then((isAdmin) => {
      setAdmin(isAdmin)
      if (isAdmin) {
        listMembers(groupId).then(setMembers)
      }
    })
  }, [groupId])

  async function handleRemove(userId: string) {
    if (!groupId) return
    setError(null)

    try {
      await removeMember(groupId, userId)
      setMembers((current) => current.filter((member) => member.userId !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo expulsar al miembro')
    }
  }

  async function handleRegenerateInviteCode() {
    if (!groupId) return
    setError(null)

    try {
      const newCode = await regenerateInviteCode(groupId)
      setInviteCode(newCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo regenerar el código')
    }
  }

  if (admin === null) return null

  if (!admin) return <p>No tenés permisos para administrar este grupo</p>

  return (
    <div>
      <h1>Miembros del grupo</h1>

      {error && <p role="alert">{error}</p>}

      <ul>
        {members.map((member) => (
          <li key={member.userId}>
            <span>{member.displayName ?? member.userId}</span> ({member.role})
            <button type="button" onClick={() => handleRemove(member.userId)}>
              Expulsar a {member.displayName ?? member.userId}
            </button>
          </li>
        ))}
      </ul>

      <button type="button" onClick={handleRegenerateInviteCode}>
        Regenerar código
      </button>

      {inviteCode && <p>Nuevo código de invitación: {inviteCode}</p>}
    </div>
  )
}
