import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseFechasWidget } from './parseFechasWidget'

const SAMPLE_HTML = readFileSync(
  join(__dirname, '__fixtures__', 'tfFechasSample.html'),
  'utf-8',
)

describe('parseFechasWidget', () => {
  it('extrae los tres partidos del fixture', () => {
    const matches = parseFechasWidget(SAMPLE_HTML)
    expect(matches).toHaveLength(3)
  })

  it('un partido ya jugado trae goles numericos y status finished', () => {
    const matches = parseFechasWidget(SAMPLE_HTML)
    const liverpoolProgreso = matches[0]

    expect(liverpoolProgreso).toEqual({
      homeTeamName: 'Liverpool',
      awayTeamName: 'Progreso',
      kickoffAt: '2026-10-03T17:00:00.000Z',
      homeGoals: 3,
      awayGoals: 2,
      status: 'finished',
    })
  })

  it('convierte el datetime de tenfield (hora local Uruguay, UTC-3) a UTC real', () => {
    const matches = parseFechasWidget(SAMPLE_HTML)
    const defensorCerroLargo = matches[1]

    expect(defensorCerroLargo.kickoffAt).toBe('2026-10-03T20:00:00.000Z')
  })

  it('un partido sin jugar trae goles null, status scheduled y no confunde la hora programada con un resultado', () => {
    const matches = parseFechasWidget(SAMPLE_HTML)
    const cerroTorque = matches[2]

    expect(cerroTorque).toEqual({
      homeTeamName: 'Cerro',
      awayTeamName: 'Montevideo City Torque',
      kickoffAt: '2026-10-16T22:00:00.000Z',
      homeGoals: null,
      awayGoals: null,
      status: 'scheduled',
    })
  })

  it('devuelve lista vacia cuando el HTML no tiene partidos', () => {
    expect(parseFechasWidget('<div>sin partidos</div>')).toEqual([])
  })
})
