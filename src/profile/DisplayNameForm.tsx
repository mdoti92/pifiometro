import { useEffect, useState, type FormEvent } from 'react'
import { fetchMyDisplayName, saveMyDisplayName } from './displayNameService'

export function DisplayNameForm({ userId }: { userId: string }) {
  const [displayName, setDisplayName] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyDisplayName(userId).then((name) => setDisplayName(name ?? ''))
  }, [userId])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaved(false)
    setError(null)

    try {
      await saveMyDisplayName(userId, displayName)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el nombre')
    }
  }

  return (
    <form className="display-name-form" onSubmit={handleSubmit}>
      <label htmlFor="display-name">Nombre o alias</label>
      <div className="display-name-row">
        <input
          id="display-name"
          type="text"
          maxLength={30}
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value)
            setSaved(false)
          }}
        />
        <button type="submit">Guardar nombre</button>
      </div>
      {saved && <p>Nombre guardado</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  )
}
