import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import * as service from '../ranking/gameScoresService'
import { localRecordStorageKey } from '../shared/localRecord'
import { resetSavedGameSessions } from '../shared/useGameLoop'
import { BOARD_COLUMNS, BOARD_ROWS } from './tetris'
import { TetrisPage } from './TetrisPage'
import { finishCountdown } from '../../test/gameCountdown'

vi.mock('../../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../auth/AuthContext')>('../../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('../ranking/gameScoresService', () => ({
  fetchMyBest: vi.fn(),
  submitGameResult: vi.fn(),
  fetchGameScores: vi.fn(),
}))

function pressKey(key: string) {
  const event = new KeyboardEvent('keydown', { key, cancelable: true })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

function filledCells() {
  return document.querySelectorAll('.tetris-board .tetris-cell.is-filled').length
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

describe('TetrisPage', () => {
  it('muestra el tablero de 10x20, puntaje, récord, líneas, nivel y próxima pieza', () => {
    localStorage.setItem(localRecordStorageKey('tetris'), '1200')

    render(<TetrisPage />)

    expect(screen.getByTestId('game-screen')).toHaveClass('lcd-nokia-unlit')
    expect(document.querySelectorAll('.tetris-board .tetris-cell')).toHaveLength(BOARD_COLUMNS * BOARD_ROWS)
    expect(screen.getByLabelText('Puntaje')).toHaveTextContent('0')
    expect(screen.getByLabelText('Récord')).toHaveTextContent('1200')
    expect(screen.getByLabelText('Líneas')).toHaveTextContent('0')
    expect(screen.getByLabelText('Nivel')).toHaveTextContent('1')
    expect(screen.getByLabelText('Próxima pieza')).toBeInTheDocument()
  })

  it('una flecha arranca la partida y evita el scroll', () => {
    render(<TetrisPage />)

    expect(pressKey('ArrowLeft').defaultPrevented).toBe(true)

    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('↓ hace hard drop: la pieza queda fija abajo', () => {
    vi.useFakeTimers()
    render(<TetrisPage />)
    pressKey('ArrowLeft')
    finishCountdown()

    pressKey('ArrowDown')

    const bottomRow = Array.from(document.querySelectorAll('.tetris-board .tetris-cell')).slice(-BOARD_COLUMNS)
    expect(bottomRow.some((cell) => cell.classList.contains('is-filled'))).toBe(true)
    expect(filledCells()).toBe(8)
  })

  it('un toque arranca y otro toque rota la pieza', () => {
    render(<TetrisPage />)
    const screenArea = screen.getByTestId('game-screen')

    fireEvent.touchStart(screenArea, { touches: [{ clientX: 0, clientY: 0 }] })
    fireEvent.touchEnd(screenArea, { changedTouches: [{ clientX: 0, clientY: 0 }] })

    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })
})
