import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { signOut } from '../auth/authService'
import { isSuperadmin } from '../tournaments/tournamentsService'

export function ProfilePage() {
  const { user } = useAuth()
  const [superadmin, setSuperadmin] = useState(false)

  useEffect(() => {
    if (!user) return
    isSuperadmin().then(setSuperadmin)
  }, [user])

  return (
    <div>
      <h1>Perfil</h1>

      {user && <p>{user.email}</p>}

      <ul>
        <li>
          <Link to="/preferences/notifications">Preferencias de notificaciones</Link>
        </li>
      </ul>

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
