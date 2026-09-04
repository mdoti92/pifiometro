import { type FormEvent, useState } from 'react'
import { joinGroup } from './groupsService'

export function JoinGroupForm() {
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setJoined(false)

    try {
      await joinGroup(inviteCode)
      setJoined(true)
      setInviteCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo unir al grupo')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Unirme a un grupo</h2>

      <label htmlFor="invite-code">Código de invitación</label>
      <input
        id="invite-code"
        value={inviteCode}
        onChange={(event) => setInviteCode(event.target.value)}
      />

      {error && <p role="alert">{error}</p>}
      {joined && <p>Te uniste al grupo</p>}

      <button type="submit">Unirme</button>
    </form>
  )
}
