import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import * as service from '../ranking/gameScoresService'
import { localRecordStorageKey } from '../shared/localRecord'
import { resetSavedGameSessions } from '../shared/useGameLoop'
import { FlappyPage } from './FlappyPage'

vi.mock('../../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../auth/AuthContext')>('../../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('../ranking/gameScoresService', () => ({
  fetchMyBest: vi.fn(),
  submitGameResult: vi.fn(),
  fetchGameScores: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  resetSavedGameSessions()
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({ session: null, user: { id: 'u1' } as never, loading: false })
  vi.mocked(service.fetchMyBest).mockResolvedValue(null)
})

describe('FlappyPage', () => {
  it('muestra la pantalla con paleta Nokia sin luz, puntaje y récord propio del juego', () => {
    localStorage.setItem(localRecordStorageKey('flappy'), '33')
    localStorage.setItem(localRecordStorageKey('snake'), '99')

    render(<FlappyPage />)

    expect(screen.getByTestId('game-screen')).toHaveClass('lcd-nokia-unlit')
    expect(screen.getByLabelText('Puntaje')).toHaveTextContent('0')
    expect(screen.getByLabelText('Récord')).toHaveTextContent('33')
    expect(screen.getByRole('img', { name: 'Flappy Bird' })).toBeInTheDocument()
  })

  it('arranca con un toque', () => {
    render(<FlappyPage />)

    fireEvent.touchStart(screen.getByTestId('game-screen'), { touches: [{ clientX: 10, clientY: 10 }] })

    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it.each([' ', 'ArrowUp'])('arranca con la tecla %j y evita el scroll', (key) => {
    render(<FlappyPage />)

    const event = new KeyboardEvent('keydown', { key, cancelable: true })
    act(() => {
      window.dispatchEvent(event)
    })

    expect(event.defaultPrevented).toBe(true)
    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('tiene botón de Ranking antes de jugar', () => {
    render(<FlappyPage />)

    expect(screen.getByRole('button', { name: 'Ranking' })).toBeInTheDocument()
  })
})
