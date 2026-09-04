import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from './authService'
import { RegisterForm } from './RegisterForm'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('./authService', async () => {
  const actual = await vi.importActual<typeof import('./authService')>('./authService')
  return { ...actual, signUp: vi.fn() }
})

const mockedSignUp = vi.mocked(authService.signUp)

beforeEach(() => {
  vi.clearAllMocks()
})

function renderForm() {
  return render(
    <MemoryRouter>
      <RegisterForm />
    </MemoryRouter>,
  )
}

describe('RegisterForm', () => {
  it('registra la cuenta y navega al inicio cuando los datos son validos', async () => {
    mockedSignUp.mockResolvedValue({ user: { id: 'user-1' }, session: { access_token: 't' } } as never)
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Email'), 'nueva@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Registrarme' }))

    expect(mockedSignUp).toHaveBeenCalledWith('nueva@example.com', 'password123')
    expect(navigateMock).toHaveBeenCalledWith('/')
  })

  it('muestra un error claro cuando el email ya esta registrado, sin navegar', async () => {
    mockedSignUp.mockRejectedValue(new authService.EmailAlreadyRegisteredError())
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Email'), 'existente@example.com')
    await user.type(screen.getByLabelText('Contraseña'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Registrarme' }))

    expect(await screen.findByText('Ya existe una cuenta registrada con ese email')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('muestra un error generico cuando falla el registro por otro motivo', async () => {
    mockedSignUp.mockRejectedValue(new Error('Password should be at least 6 characters'))
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Email'), 'nueva@example.com')
    await user.type(screen.getByLabelText('Contraseña'), '123')
    await user.click(screen.getByRole('button', { name: 'Registrarme' }))

    expect(await screen.findByText('Password should be at least 6 characters')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
