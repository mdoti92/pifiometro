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

  it('redirige a login al visitar /groups/:groupId/members sin sesion activa', () => {
    mockedUseAuth.mockReturnValue({ session: null, user: null, loading: false })

    renderAppAt('/groups/group-1/members')

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('redirige a login al visitar /admin/tournaments sin sesion activa', () => {
    mockedUseAuth.mockReturnValue({ session: null, user: null, loading: false })

    renderAppAt('/admin/tournaments')

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('redirige a login al visitar /groups/:groupId/tournaments sin sesion activa', () => {
    mockedUseAuth.mockReturnValue({ session: null, user: null, loading: false })

    renderAppAt('/groups/group-1/tournaments')

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('redirige a login al visitar /preferences/notifications sin sesion activa', () => {
    mockedUseAuth.mockReturnValue({ session: null, user: null, loading: false })

    renderAppAt('/preferences/notifications')

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('redirige a login al visitar /admin/tournaments/:tournamentId/matches sin sesion activa', () => {
    mockedUseAuth.mockReturnValue({ session: null, user: null, loading: false })

    renderAppAt('/admin/tournaments/tournament-1/matches')

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('redirige a login al visitar /groups/:groupId/matches/:matchId/predict sin sesion activa', () => {
    mockedUseAuth.mockReturnValue({ session: null, user: null, loading: false })

    renderAppAt('/groups/group-1/matches/match-1/predict')

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('redirige a login al visitar /groups/:groupId/stages/:stageId/predictions sin sesion activa', () => {
    mockedUseAuth.mockReturnValue({ session: null, user: null, loading: false })

    renderAppAt('/groups/group-1/stages/stage-1/predictions')

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
