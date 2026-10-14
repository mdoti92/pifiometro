import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import * as service from '../ranking/gameScoresService'
import { localRecordStorageKey } from '../shared/localRecord'
import { resetSavedGameSessions } from '../shared/useGameLoop'
import { SmallBeePage } from './SmallBeePage'

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

describe('SmallBeePage', () => {
  it('muestra paleta Motorola, puntaje, récord propio del juego y 3 vidas', () => {
    localStorage.setItem(localRecordStorageKey('small-bee'), '21')
    localStorage.setItem(localRecordStorageKey('spring-ball'), '99')

    render(<SmallBeePage />)

    expect(screen.getByTestId('game-screen')).toHaveClass('lcd-motorola-c115')
    expect(screen.getByLabelText('Puntaje')).toHaveTextContent('0')
    expect(screen.getByLabelText('Récord')).toHaveTextContent('21')
    expect(screen.getByLabelText('Vidas')).toHaveTextContent('3')
    expect(screen.getByRole('img', { name: 'Small Bee' })).toBeInTheDocument()
  })

  it('arranca con un toque', () => {
    render(<SmallBeePage />)

    fireEvent.touchStart(screen.getByTestId('game-screen'), { touches: [{ clientX: 10, clientY: 10 }] })

    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('arranca con una flecha y evita el scroll', () => {
    render(<SmallBeePage />)

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true })
    act(() => {
      window.dispatchEvent(event)
    })

    expect(event.defaultPrevented).toBe(true)
    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('tiene botón de Ranking antes de jugar', () => {
    render(<SmallBeePage />)

    expect(screen.getByRole('button', { name: 'Ranking' })).toBeInTheDocument()
  })
})
