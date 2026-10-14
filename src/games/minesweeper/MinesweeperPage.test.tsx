import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import { MINESWEEPER_GAME, formatGameValue } from '../catalog'
import * as service from '../ranking/gameScoresService'
import { localRecordStorageKey } from '../shared/localRecord'
import { resetSavedGameSessions } from '../shared/useGameLoop'
import { LONG_PRESS_MS, MinesweeperPage } from './MinesweeperPage'
import { BOARD_SIZE, MINE_COUNT } from './minesweeper'

vi.mock('../../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../auth/AuthContext')>('../../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('../ranking/gameScoresService', () => ({
  fetchMyBest: vi.fn(),
  submitGameResult: vi.fn(),
  fetchGameScores: vi.fn(),
}))

function cell(x: number, y: number) {
  return screen.getByRole('button', { name: `Celda ${x + 1}, ${y + 1}` })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  resetSavedGameSessions()
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({ session: null, user: { id: 'u1' } as never, loading: false })
  vi.mocked(service.fetchMyBest).mockResolvedValue(null)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('MinesweeperPage', () => {
  it('muestra la grilla tapada, minas restantes, cronómetro en 0 y mejor tiempo', () => {
    localStorage.setItem(localRecordStorageKey('minesweeper'), '75')

    render(<MinesweeperPage />)

    expect(screen.getAllByRole('button', { name: /^Celda/ })).toHaveLength(BOARD_SIZE * BOARD_SIZE)
    expect(screen.getByLabelText('Minas restantes')).toHaveTextContent(String(MINE_COUNT))
    expect(screen.getByLabelText('Tiempo')).toHaveTextContent('0:00')
    expect(screen.getByLabelText('Mejor tiempo')).toHaveTextContent('1:15')
  })

  it('formatea los tiempos como m:ss en el ranking', () => {
    expect(formatGameValue(MINESWEEPER_GAME, 75)).toBe('1:15')
  })

  it('destapar la primera celda la muestra y nunca es mina', () => {
    render(<MinesweeperPage />)

    fireEvent.click(cell(4, 4))

    expect(cell(4, 4)).toHaveAttribute('data-revealed', 'true')
    expect(screen.queryByText('Game Over')).not.toBeInTheDocument()
  })

  it('click derecho pone bandera, descuenta minas y no abre el menú del navegador', () => {
    render(<MinesweeperPage />)

    const contextMenu = fireEvent.contextMenu(cell(0, 0))

    expect(contextMenu).toBe(false)
    expect(cell(0, 0)).toHaveAttribute('data-flagged', 'true')
    expect(screen.getByLabelText('Minas restantes')).toHaveTextContent(String(MINE_COUNT - 1))
  })

  it('mantener presionada una celda pone bandera y no la destapa', () => {
    vi.useFakeTimers()
    render(<MinesweeperPage />)

    fireEvent.touchStart(cell(2, 2), { touches: [{ clientX: 0, clientY: 0 }] })
    act(() => {
      vi.advanceTimersByTime(LONG_PRESS_MS)
    })
    fireEvent.touchEnd(cell(2, 2), { changedTouches: [{ clientX: 0, clientY: 0 }] })
    fireEvent.click(cell(2, 2))

    expect(cell(2, 2)).toHaveAttribute('data-flagged', 'true')
    expect(cell(2, 2)).toHaveAttribute('data-revealed', 'false')
  })

  it('el cronómetro avanza una vez arrancada la partida', () => {
    vi.useFakeTimers()
    render(<MinesweeperPage />)

    fireEvent.click(cell(4, 4))
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByLabelText('Tiempo')).toHaveTextContent('0:03')
  })
})
