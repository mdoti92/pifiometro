import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from './authService'

export function RegisterForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    try {
      await signUp(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Crear cuenta</h1>

      <label htmlFor="register-email">Email</label>
      <input
        id="register-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <label htmlFor="register-password">Contraseña</label>
      <input
        id="register-password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      {error && <p role="alert">{error}</p>}

      <button type="submit">Registrarme</button>
    </form>
  )
}
