import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import * as service from '../ranking/gameScoresService'
import { localRecordStorageKey } from '../shared/localRecord'
import { BOARD_COLUMNS, BOARD_ROWS, INITIAL_SNAKE_LENGTH } from './snakeGame'
import { MIN_SWIPE_DISTANCE_PX } from '../shared/input'
import { resetSavedGameSessions } from '../shared/useGameLoop'
import { SnakeGamePage } from './SnakeGamePage'

vi.mock('../../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../auth/AuthContext')>('../../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('../ranking/gameScoresService', () => ({
  fetchMyBest: vi.fn(),
  submitGameResult: vi.fn(),
  fetchGameScores: vi.fn(),
}))

const HIGH_SCORE_STORAGE_KEY = localRecordStorageKey('snake')

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  resetSavedGameSessions()
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({ session: null, user: { id: 'u1' } as never, loading: false })
  vi.mocked(service.fetchMyBest).mockResolvedValue(null)
  vi.mocked(service.fetchGameScores).mockResolvedValue([])
})

function swipe(target: HTMLElement, deltaX: number, deltaY: number) {
  fireEvent.touchStart(target, { touches: [{ clientX: 100, clientY: 100 }] })
  fireEvent.touchEnd(target, { changedTouches: [{ clientX: 100 + deltaX, clientY: 100 + deltaY }] })
}

describe('SnakeGamePage', () => {
  it('dibuja el tablero con la víbora y la comida', () => {
    render(<SnakeGamePage />)

    expect(screen.getAllByTestId('snake-cell')).toHaveLength(BOARD_COLUMNS * BOARD_ROWS)
    expect(document.querySelectorAll('.snake-cell.is-snake')).toHaveLength(INITIAL_SNAKE_LENGTH)
    expect(document.querySelectorAll('.snake-cell.is-food')).toHaveLength(1)
  })

  it('muestra el puntaje y el récord guardado', () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '17')

    render(<SnakeGamePage />)

    expect(screen.getByLabelText('Puntaje')).toHaveTextContent('0')
    expect(screen.getByLabelText('Récord')).toHaveTextContent('17')
  })

  it('invita a tocar para empezar y arranca con un toque', () => {
    render(<SnakeGamePage />)
    expect(screen.getByText(/tocá para jugar/i)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('game-screen'))

    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('una flecha del teclado arranca el juego y evita el scroll de la página', () => {
    render(<SnakeGamePage />)

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true })
    act(() => {
      window.dispatchEvent(event)
    })

    expect(event.defaultPrevented).toBe(true)
    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('un swipe arranca el juego', () => {
    render(<SnakeGamePage />)

    swipe(screen.getByTestId('game-screen'), 0, -MIN_SWIPE_DISTANCE_PX * 2)

    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('al desmontar deja de capturar las flechas', () => {
    const { unmount } = render(<SnakeGamePage />)
    unmount()

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })

  it('muestra como récord el mejor entre el local y el del ranking', async () => {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, '4')
    vi.mocked(service.fetchMyBest).mockResolvedValue(11)

    render(<SnakeGamePage />)

    await waitFor(() => expect(screen.getByLabelText('Récord')).toHaveTextContent('11'))
  })

  it('el botón Ranking abre el ranking sin arrancar el juego', async () => {
    render(<SnakeGamePage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ranking' }))

    expect(await screen.findByRole('dialog', { name: 'Ranking de Viborita' })).toBeInTheDocument()
    expect(screen.getByText(/tocá para jugar/i)).toBeInTheDocument()
  })
})
