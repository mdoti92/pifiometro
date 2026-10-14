import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { signOut } from '../auth/authService'
import { isGroupAdmin } from '../groups/groupMembersService'
import { listMyGroups, type MyGroup } from '../groups/groupsService'
import { useActiveGroup } from '../nav/useActiveGroup'
import { isSuperadmin } from '../tournaments/tournamentsService'
import { PaletteSelector } from './PaletteSelector'

export function ProfilePage() {
  const { user } = useAuth()
  const [superadmin, setSuperadmin] = useState(false)
  const [groups, setGroups] = useState<MyGroup[]>([])
  const { activeGroupId } = useActiveGroup(groups)
  const [groupAdmin, setGroupAdmin] = useState(false)

  useEffect(() => {
    if (!user) return
    isSuperadmin().then(setSuperadmin)
    listMyGroups(user.id).then(setGroups)
  }, [user])

  useEffect(() => {
    if (!activeGroupId) return
    isGroupAdmin(activeGroupId).then(setGroupAdmin)
  }, [activeGroupId])

  return (
    <div>
      <h1>Perfil</h1>

      {user && <p>{user.email}</p>}

      <ul>
        <li>
          <Link to="/preferences/notifications">Preferencias de notificaciones</Link>
        </li>
        {groupAdmin && activeGroupId && (
          <li>
            <Link to={`/groups/${activeGroupId}/members`}>Grupo</Link>
          </li>
        )}
      </ul>

      <PaletteSelector />

      {superadmin && (
        <section>
          <h2>Administración</h2>
          <ul>
            <li>
              <Link to="/admin/tournaments">Torneos y etapas</Link>
            </li>
          </ul>
        </section>
      )}

      <button type="button" onClick={() => signOut()}>
        Cerrar sesión
      </button>
    </div>
  )
}
