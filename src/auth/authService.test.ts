import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '../lib/supabase'
import { EmailAlreadyRegisteredError, signInWithGoogle, signInWithPassword, signUp } from './authService'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}))

const mockedAuth = vi.mocked(supabase.auth)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('signUp', () => {
  it('crea la cuenta y devuelve el usuario y la sesion cuando el email no estaba registrado', async () => {
    const user = { id: 'user-1', identities: [{ id: 'identity-1' }] }
    const session = { access_token: 'token' }
    mockedAuth.signUp.mockResolvedValue({
      data: { user, session },
      error: null,
      // biome-ignore lint: shape mínimo necesario para el mock
    } as never)

    const result = await signUp('nueva@example.com', 'password123')

    expect(mockedAuth.signUp).toHaveBeenCalledWith({
      email: 'nueva@example.com',
      password: 'password123',
    })
    expect(result).toEqual({ user, session })
  })

  it('lanza EmailAlreadyRegisteredError sin crear cuenta duplicada cuando el email ya existe', async () => {
    // Supabase responde 200 con user pero identities: [] cuando el email ya está registrado
    const user = { id: 'user-1', identities: [] }
    mockedAuth.signUp.mockResolvedValue({
      data: { user, session: null },
      error: null,
    } as never)

    await expect(signUp('existente@example.com', 'password123')).rejects.toThrow(
      EmailAlreadyRegisteredError,
    )
  })

  it('lanza EmailAlreadyRegisteredError cuando supabase devuelve el error nativo de usuario duplicado', async () => {
    mockedAuth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    } as never)

    await expect(signUp('existente@example.com', 'password123')).rejects.toThrow(
      EmailAlreadyRegisteredError,
    )
  })

  it('propaga otros errores de supabase tal cual', async () => {
    mockedAuth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Password should be at least 6 characters' },
    } as never)

    await expect(signUp('nueva@example.com', '123')).rejects.toThrow(
      'Password should be at least 6 characters',
    )
  })
})

describe('signInWithPassword', () => {
  it('devuelve el usuario y la sesion cuando las credenciales son validas', async () => {
    const user = { id: 'user-1' }
    const session = { access_token: 'token' }
    mockedAuth.signInWithPassword.mockResolvedValue({
      data: { user, session },
      error: null,
    } as never)

    const result = await signInWithPassword('user@example.com', 'password123')

    expect(mockedAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result).toEqual({ user, session })
  })

  it('propaga el error cuando las credenciales son invalidas', async () => {
    mockedAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    } as never)

    await expect(signInWithPassword('user@example.com', 'mala-clave')).rejects.toThrow(
      'Invalid login credentials',
    )
  })
})

describe('signInWithGoogle', () => {
  it('inicia el flujo de OAuth con Google', async () => {
    mockedAuth.signInWithOAuth.mockResolvedValue({ data: {}, error: null } as never)

    await signInWithGoogle()

    expect(mockedAuth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google' })
  })
})
