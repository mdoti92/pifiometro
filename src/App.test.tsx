import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import * as AuthContextModule from './auth/AuthContext'

vi.mock('./auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('./auth/AuthContext')>('./auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)

beforeEach(() => {
  vi.clearAllMocks()
})

function renderAppAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('redirige a login cuando se visita la raiz sin sesion activa', () => {
    mockedUseAuth.mockReturnValue({ session: null, user: null, loading: false })

    renderAppAt('/')

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('muestra la pantalla de crear grupo cuando se visita la raiz con sesion activa', () => {
    mockedUseAuth.mockReturnValue({
      session: { access_token: 't' } as never,
      user: { id: 'user-1' } as never,
      loading: false,
    })

    renderAppAt('/')

    expect(screen.getByRole('heading', { name: 'Crear grupo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Unirme a un grupo' })).toBeInTheDocument()
  })

  it('muestra el formulario de registro en /register', () => {
    mockedUseAuth.mockReturnValue({ session: null, user: null, loading: false })

    renderAppAt('/register')

    expect(screen.getByRole('button', { name: 'Registrarme' })).toBeInTheDocument()
  })
})
