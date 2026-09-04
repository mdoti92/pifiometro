import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from './authService'
import { LoginForm } from './LoginForm'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('./authService', async () => {
  const actual = await vi.importActual<typeof import('./authService')>('./authService')
  return { ...actual, signInWithPassword: vi.fn(), signInWithGoogle: vi.fn() }
})

const mockedSignInWithPassword = vi.mocked(authService.signInWithPassword)
const mockedSignInWithGoogle = vi.mocked(authService.signInWithGoogle)

beforeEach(() => {
  vi.clearAllMocks()
})

function renderForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  )
}

describe('LoginForm', () => {
  it('inicia sesion y navega al inicio cuando las credenciales son validas', async () => {
    mockedSignInWithPassword.mockResolvedValue({
      user: { id: 'user-1' },
      session: { access_token: 't' },
    } as never)
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(mockedSignInWithPassword).toHaveBeenCalledWith('user@example.com', 'password123')
    expect(navigateMock).toHaveBeenCalledWith('/')
  })

  it('muestra un error cuando las credenciales son invalidas, sin navegar', async () => {
    mockedSignInWithPassword.mockRejectedValue(new Error('Invalid login credentials'))
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'mala-clave')
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('inicia el flujo de Google al hacer click en el boton correspondiente', async () => {
    mockedSignInWithGoogle.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    expect(mockedSignInWithGoogle).toHaveBeenCalled()
  })

  it('muestra un error cuando falla el inicio de sesion con Google', async () => {
    mockedSignInWithGoogle.mockRejectedValue(new Error('No se pudo iniciar sesion con Google'))
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }))

    expect(await screen.findByText('No se pudo iniciar sesion con Google')).toBeInTheDocument()
  })
})
