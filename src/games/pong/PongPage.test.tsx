import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import * as service from '../ranking/gameScoresService'
import { localRecordStorageKey } from '../shared/localRecord'
import { resetSavedGameSessions } from '../shared/useGameLoop'
import { PONG_LOSSES_STORAGE_KEY, PongPage } from './PongPage'

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

describe('PongPage', () => {
  it('muestra el marcador y el historial de partidos ganados y perdidos', () => {
    localStorage.setItem(localRecordStorageKey('pong'), '4')
    localStorage.setItem(PONG_LOSSES_STORAGE_KEY, '2')

    render(<PongPage />)

    expect(screen.getByTestId('game-screen')).toHaveClass('lcd-nokia-unlit')
    expect(screen.getByLabelText('Mis puntos')).toHaveTextContent('0')
    expect(screen.getByLabelText('Puntos de la CPU')).toHaveTextContent('0')
    expect(screen.getByLabelText('Partidos ganados')).toHaveTextContent('4')
    expect(screen.getByLabelText('Partidos perdidos')).toHaveTextContent('2')
    expect(screen.getByRole('img', { name: 'Pong' })).toBeInTheDocument()
  })

  it('arranca con un toque', () => {
    render(<PongPage />)

    fireEvent.touchStart(screen.getByTestId('game-screen'), { touches: [{ clientX: 10, clientY: 10 }] })

    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('arranca con una flecha y evita el scroll', () => {
    render(<PongPage />)

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
    act(() => {
      window.dispatchEvent(event)
    })

    expect(event.defaultPrevented).toBe(true)
    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })
})
