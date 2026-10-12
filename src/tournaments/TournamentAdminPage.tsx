import { type FormEvent, useEffect, useState } from 'react'
import {
  createTournament,
  isSuperadmin,
  listTournamentStages,
  renameStage,
  type TournamentStage,
} from './tournamentsService'

export function TournamentAdminPage() {
  const [admin, setAdmin] = useState<boolean | null>(null)
  const [name, setName] = useState('')
  const [season, setSeason] = useState('')
  const [stageNames, setStageNames] = useState<string[]>([''])
  const [stages, setStages] = useState<TournamentStage[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    isSuperadmin().then(setAdmin)
  }, [])

  function updateStageName(index: number, value: string) {
    setStageNames((current) => current.map((stage, i) => (i === index ? value : stage)))
  }

  function addStageInput() {
    setStageNames((current) => [...current, ''])
  }

  function removeStageInput(index: number) {
    setStageNames((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    try {
      const tournament = await createTournament(
        name,
        season,
        stageNames.map((stageName) => stageName.trim()).filter(Boolean),
      )
      const createdStages = await listTournamentStages(tournament.id)
      setStages(createdStages)
      setName('')
      setSeason('')
      setStageNames([''])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el torneo')
    }
  }

  async function handleRenameStage(stageId: string, newName: string) {
    setError(null)

    try {
      await renameStage(stageId, newName)
      setStages((current) =>
        current.map((stage) => (stage.id === stageId ? { ...stage, name: newName } : stage)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo renombrar la etapa')
    }
  }

  if (admin === null) return null

  if (!admin) return <p>No tenés permisos para administrar torneos</p>

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Crear torneo</h1>

        <label htmlFor="tournament-name">Nombre del torneo</label>
        <input id="tournament-name" value={name} onChange={(event) => setName(event.target.value)} />

        <label htmlFor="tournament-season">Temporada</label>
        <input
          id="tournament-season"
          value={season}
          onChange={(event) => setSeason(event.target.value)}
        />

        {stageNames.map((stageName, index) => (
          // biome-ignore lint: el orden de las etapas es fijo mientras se completa el form, no hay id estable todavia
          <div key={index}>
            <label htmlFor={`stage-${index}`}>Etapa {index + 1}</label>
            <input
              id={`stage-${index}`}
              value={stageName}
              onChange={(event) => updateStageName(index, event.target.value)}
            />
            {stageNames.length > 1 && (
              <button type="button" onClick={() => removeStageInput(index)}>
                Quitar etapa
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addStageInput}>
          Agregar etapa
        </button>

        {error && <p role="alert">{error}</p>}

        <button type="submit">Crear torneo</button>
      </form>

      <ul>
        {stages.map((stage) => (
          <li key={stage.id}>
            <StageNameEditor stage={stage} onSave={(newName) => handleRenameStage(stage.id, newName)} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function StageNameEditor({
  stage,
  onSave,
}: {
  stage: TournamentStage
  onSave: (newName: string) => void
}) {
  const [name, setName] = useState(stage.name)

  return (
    <>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <button type="button" onClick={() => onSave(name)}>
        Guardar nombre de etapa
      </button>
    </>
  )
}
