import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

const mockedAuth = vi.mocked(supabase.auth)

function AuthConsumer() {
  const { session, user, loading } = useAuth()

  if (loading) return <p>cargando</p>

  return (
    <p>{session ? `sesion activa: ${user?.email}` : 'sin sesion'}</p>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AuthProvider', () => {
  it('muestra loading mientras resuelve la sesion inicial', async () => {
    let resolveGetSession: (value: unknown) => void = () => {}
    mockedAuth.getSession.mockReturnValue(
      new Promise((resolve) => {
        resolveGetSession = resolve
      }) as never,
    )
    mockedAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as never)

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    expect(screen.getByText('cargando')).toBeInTheDocument()

    await act(async () => {
      resolveGetSession({ data: { session: null }, error: null })
    })
  })

  it('expone sesion null cuando no hay sesion activa', async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: null }, error: null } as never)
    mockedAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as never)

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('sin sesion')).toBeInTheDocument())
  })

  it('expone la sesion y el usuario cuando hay sesion activa', async () => {
    const session = { access_token: 'token', user: { id: 'user-1', email: 'user@example.com' } }
    mockedAuth.getSession.mockResolvedValue({ data: { session }, error: null } as never)
    mockedAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as never)

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() =>
      expect(screen.getByText('sesion activa: user@example.com')).toBeInTheDocument(),
    )
  })

  it('actualiza la sesion cuando supabase dispara un cambio de estado de auth', async () => {
    mockedAuth.getSession.mockResolvedValue({ data: { session: null }, error: null } as never)

    let authStateCallback: (event: string, session: unknown) => void = () => {}
    mockedAuth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback as never
      return { data: { subscription: { unsubscribe: vi.fn() } } } as never
    })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('sin sesion')).toBeInTheDocument())

    const session = { access_token: 'token', user: { id: 'user-1', email: 'nueva@example.com' } }
    act(() => {
      authStateCallback('SIGNED_IN', session)
    })

    await waitFor(() =>
      expect(screen.getByText('sesion activa: nueva@example.com')).toBeInTheDocument(),
    )
  })

  it('se desuscribe del listener de auth al desmontar', async () => {
    const unsubscribe = vi.fn()
    mockedAuth.getSession.mockResolvedValue({ data: { session: null }, error: null } as never)
    mockedAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    } as never)

    const { unmount } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('sin sesion')).toBeInTheDocument())

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})
