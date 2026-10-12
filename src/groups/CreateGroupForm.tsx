import { type FormEvent, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { createGroup, GroupNameRequiredError, type Group } from './groupsService'

export function CreateGroupForm() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!user) return

    if (!name.trim()) {
      setError(new GroupNameRequiredError().message)
      return
    }

    try {
      const group = await createGroup(name, user.id)
      setCreatedGroup(group)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el grupo')
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Crear grupo</h1>

        <label htmlFor="group-name">Nombre del grupo</label>
        <input id="group-name" value={name} onChange={(event) => setName(event.target.value)} />

        {error && <p role="alert">{error}</p>}

        <button type="submit">Crear grupo</button>
      </form>

      {createdGroup && (
        <p>
          Grupo "{createdGroup.name}" creado. Código de invitación: {createdGroup.inviteCode}
        </p>
      )}
    </div>
  )
}
