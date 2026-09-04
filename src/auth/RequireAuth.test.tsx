import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from './AuthContext'
import { RequireAuth } from './RequireAuth'

vi.mock('./AuthContext', async () => {
  const actual = await vi.importActual<typeof import('./AuthContext')>('./AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)

beforeEach(() => {
  vi.clearAllMocks()
})

function renderWithRoutes() {
  return render(
    <MemoryRouter initialEntries={['/grupos']}>
      <Routes>
        <Route path="/login" element={<p>pantalla de login</p>} />
        <Route
          path="/grupos"
          element={
            <RequireAuth>
              <p>pantalla de grupos</p>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  it('no renderiza ni redirige mientras se resuelve la sesion inicial', () => {
    mockedUseAuth.mockReturnValue({ session: null, user: null, loading: true })

    renderWithRoutes()

    expect(screen.queryByText('pantalla de grupos')).not.toBeInTheDocument()
    expect(screen.queryByText('pantalla de login')).not.toBeInTheDocument()
  })

  it('redirige a login cuando no hay sesion activa', () => {
    mockedUseAuth.mockReturnValue({ session: null, user: null, loading: false })

    renderWithRoutes()

    expect(screen.getByText('pantalla de login')).toBeInTheDocument()
  })

  it('renderiza la pantalla protegida cuando hay sesion activa', () => {
    mockedUseAuth.mockReturnValue({
      session: { access_token: 't' } as never,
      user: { id: 'user-1' } as never,
      loading: false,
    })

    renderWithRoutes()

    expect(screen.getByText('pantalla de grupos')).toBeInTheDocument()
  })
})
