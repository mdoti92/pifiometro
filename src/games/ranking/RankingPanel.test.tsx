import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import type { GameDefinition } from '../catalog'
import * as service from './gameScoresService'
import { RankingPanel } from './RankingPanel'

vi.mock('../../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../auth/AuthContext')>('../../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./gameScoresService', () => ({
  fetchGameScores: vi.fn(),
  fetchMyBest: vi.fn(),
  submitGameResult: vi.fn(),
}))

const mockedFetchScores = vi.mocked(service.fetchGameScores)

const SNAKE: GameDefinition = { key: 'snake', name: 'Viborita', description: '', path: '/games/snake', metric: 'highest' }

function score(userId: string, value: number, displayName = userId) {
  return { userId, displayName, value, achievedAt: '2026-10-01T00:00:00Z' }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({ session: null, user: { id: 'u2' } as never, loading: false })
})

describe('RankingPanel', () => {
  it('muestra el top con posición, nombre y marca, y resalta mi fila', async () => {
    mockedFetchScores.mockResolvedValue([score('u1', 5, 'Aldo'), score('u2', 9, 'Doti')])

    render(<RankingPanel game={SNAKE} onClose={vi.fn()} />)

    const rows = await screen.findAllByRole('row')
    const bodyRows = rows.slice(1)
    expect(within(bodyRows[0]).getByText('Doti')).toBeInTheDocument()
    expect(within(bodyRows[0]).getByText('9')).toBeInTheDocument()
    expect(within(bodyRows[1]).getByText('Aldo')).toBeInTheDocument()
    expect(bodyRows[0]).toHaveClass('is-current-user')
    expect(bodyRows[1]).not.toHaveClass('is-current-user')
  })

  it('si quedé fuera del top muestro mi posición abajo, resaltada', async () => {
    const others = Array.from({ length: 10 }, (_, index) => score(`o${index}`, 100 - index))
    mockedFetchScores.mockResolvedValue([...others, score('u2', 1, 'Doti')])

    render(<RankingPanel game={SNAKE} onClose={vi.fn()} />)

    const mine = await screen.findByTestId('ranking-current-user')
    expect(mine).toHaveTextContent('11°')
    expect(mine).toHaveTextContent('Doti')
  })

  it('avisa si todavía no hay puntajes', async () => {
    mockedFetchScores.mockResolvedValue([])

    render(<RankingPanel game={SNAKE} onClose={vi.fn()} />)

    expect(await screen.findByText(/todavía no hay puntajes/i)).toBeInTheDocument()
  })

  it('avisa si no se pudo cargar', async () => {
    mockedFetchScores.mockRejectedValue(new Error('sin conexión'))

    render(<RankingPanel game={SNAKE} onClose={vi.fn()} />)

    expect(await screen.findByText(/no se pudo cargar/i)).toBeInTheDocument()
  })

  it('se cierra con el botón', async () => {
    mockedFetchScores.mockResolvedValue([])
    const onClose = vi.fn()
    render(<RankingPanel game={SNAKE} onClose={onClose} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar' }))

    expect(onClose).toHaveBeenCalled()
  })
})
