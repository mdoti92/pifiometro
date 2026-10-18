import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PRIVATE_APP_MESSAGE, isAllowed } from './accessService'
import { useAuth } from './AuthContext'
import { signOut } from './authService'

type AccessState = 'checking' | 'allowed' | 'denied' | 'error'

/** Deja pasar solo a los usuarios de la whitelist de Pifiómetro. Va dentro de RequireAuth. */
export function AccessGate({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [state, setState] = useState<AccessState>('checking')

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    isAllowed()
      .then((allowed) => {
        if (cancelled) return
        setState(allowed ? 'allowed' : 'denied')
        if (!allowed) signOut().catch(() => {})
      })
      .catch(() => !cancelled && setState('error'))
    return () => {
      cancelled = true
    }
  }, [userId])

  if (state === 'allowed') return children
  if (state === 'checking') return null

  return (
    <main>
      <h1>{state === 'denied' ? 'Acceso privado' : 'Algo falló'}</h1>
      <p role="alert">{state === 'denied' ? PRIVATE_APP_MESSAGE : 'No se pudo verificar el acceso. Probá de nuevo.'}</p>
      <Link to="/login">Volver a entrar</Link>
    </main>
  )
}
