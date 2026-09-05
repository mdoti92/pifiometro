import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import { PredictionForm } from './PredictionForm'
import * as predictionsService from './predictionsService'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./predictionsService', async () => {
  const actual =
    await vi.importActual<typeof import('./predictionsService')>('./predictionsService')
  return { ...actual, getPrediction: vi.fn(), savePrediction: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedGetPrediction = vi.mocked(predictionsService.getPrediction)
const mockedSavePrediction = vi.mocked(predictionsService.savePrediction)

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { access_token: 't' } as never,
    user: { id: 'user-1' } as never,
    loading: false,
  })
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/groups/group-1/matches/match-1/predict']}>
      <Routes>
        <Route path="/groups/:groupId/matches/:matchId/predict" element={<PredictionForm />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PredictionForm', () => {
  it('precarga el pronostico ya cargado', async () => {
    mockedGetPrediction.mockResolvedValue({ homeGoals: 2, awayGoals: 1 })
    renderPage()

    expect(await screen.findByDisplayValue('2')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()
  })

  it('guarda el pronostico asociado al usuario, partido y grupo', async () => {
    mockedGetPrediction.mockResolvedValue(null)
    mockedSavePrediction.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    const homeInput = await screen.findByLabelText('Goles local')
    const awayInput = screen.getByLabelText('Goles visitante')
    await user.clear(homeInput)
    await user.type(homeInput, '2')
    await user.clear(awayInput)
    await user.type(awayInput, '1')
    await user.click(screen.getByRole('button', { name: 'Guardar pronóstico' }))

    expect(mockedSavePrediction).toHaveBeenCalledWith({
      matchId: 'match-1',
      groupId: 'group-1',
      userId: 'user-1',
      homeGoals: 2,
      awayGoals: 1,
    })
    expect(await screen.findByText('Pronóstico guardado')).toBeInTheDocument()
  })

  it('muestra un error de validacion cuando el valor no es valido', async () => {
    mockedGetPrediction.mockResolvedValue(null)
    mockedSavePrediction.mockRejectedValue(new predictionsService.InvalidGoalsError())
    const user = userEvent.setup()
    renderPage()

    const homeInput = await screen.findByLabelText('Goles local')
    await user.clear(homeInput)
    await user.type(homeInput, '-1')
    await user.click(screen.getByRole('button', { name: 'Guardar pronóstico' }))

    expect(
      await screen.findByText('Los goles deben ser un número entero mayor o igual a 0'),
    ).toBeInTheDocument()
  })

  it('muestra un error generico cuando falla el guardado (ej. el partido ya arranco)', async () => {
    mockedGetPrediction.mockResolvedValue(null)
    mockedSavePrediction.mockRejectedValue(new Error('new row violates row-level security policy'))
    const user = userEvent.setup()
    renderPage()

    const homeInput = await screen.findByLabelText('Goles local')
    await user.clear(homeInput)
    await user.type(homeInput, '2')
    await user.click(screen.getByRole('button', { name: 'Guardar pronóstico' }))

    expect(
      await screen.findByText('new row violates row-level security policy'),
    ).toBeInTheDocument()
  })
})
