import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as accessService from './accessService'
import { AccessGate } from './AccessGate'
import * as AuthContextModule from './AuthContext'
import * as authService from './authService'

vi.mock('./AuthContext', async () => {
  const actual = await vi.importActual<typeof import('./AuthContext')>('./AuthContext')
  return { ...actual, useAuth: vi.fn() }
})
vi.mock('./accessService', async () => {
  const actual = await vi.importActual<typeof import('./accessService')>('./accessService')
  return { ...actual, isAllowed: vi.fn() }
})
vi.mock('./authService', async () => {
  const actual = await vi.importActual<typeof import('./authService')>('./authService')
  return { ...actual, signOut: vi.fn().mockResolvedValue(undefined) }
})

function renderGate() {
  return render(
    <MemoryRouter>
      <AccessGate>
        <p>Grupos</p>
      </AccessGate>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({ session: {} as never, user: { id: 'u1' } as never, loading: false })
})

describe('AccessGate', () => {
  it('deja pasar a quien está en la whitelist de Pifiómetro', async () => {
    vi.mocked(accessService.isAllowed).mockResolvedValue(true)
    renderGate()

    expect(await screen.findByText('Grupos')).toBeInTheDocument()
    expect(authService.signOut).not.toHaveBeenCalled()
  })

  it('a quien no está le muestra el aviso de app privada y le cierra la sesión', async () => {
    vi.mocked(accessService.isAllowed).mockResolvedValue(false)
    renderGate()

    expect(await screen.findByRole('alert')).toHaveTextContent(accessService.PRIVATE_APP_MESSAGE)
    expect(screen.queryByText('Grupos')).not.toBeInTheDocument()
    expect(authService.signOut).toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Volver a entrar' })).toHaveAttribute('href', '/login')
  })

  it('si no se puede verificar, no muestra la app ni cierra la sesión', async () => {
    vi.mocked(accessService.isAllowed).mockRejectedValue(new Error('red'))
    renderGate()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo verificar el acceso')
    expect(screen.queryByText('Grupos')).not.toBeInTheDocument()
    expect(authService.signOut).not.toHaveBeenCalled()
  })
})
