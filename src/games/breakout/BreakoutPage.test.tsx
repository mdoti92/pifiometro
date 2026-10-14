import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import * as service from '../ranking/gameScoresService'
import { localRecordStorageKey } from '../shared/localRecord'
import { resetSavedGameSessions } from '../shared/useGameLoop'
import { BreakoutPage } from './BreakoutPage'

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

describe('BreakoutPage', () => {
  it('muestra puntaje, récord propio y 3 vidas con paleta Nokia sin luz', () => {
    localStorage.setItem(localRecordStorageKey('breakout'), '40')

    render(<BreakoutPage />)

    expect(screen.getByTestId('game-screen')).toHaveClass('lcd-nokia-unlit')
    expect(screen.getByLabelText('Puntaje')).toHaveTextContent('0')
    expect(screen.getByLabelText('Vidas')).toHaveTextContent('3')
    expect(screen.getByLabelText('Récord')).toHaveTextContent('40')
    expect(screen.getByRole('img', { name: 'Breakout' })).toBeInTheDocument()
  })

  it('arranca con un toque', () => {
    render(<BreakoutPage />)

    fireEvent.touchStart(screen.getByTestId('game-screen'), { touches: [{ clientX: 10, clientY: 10 }] })

    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('arranca con espacio y evita el scroll', () => {
    render(<BreakoutPage />)

    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true })
    act(() => {
      window.dispatchEvent(event)
    })

    expect(event.defaultPrevented).toBe(true)
    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })
})
