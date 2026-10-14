import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import { VRALLY_GAME, formatGameValue } from '../catalog'
import * as service from '../ranking/gameScoresService'
import { localRecordStorageKey } from '../shared/localRecord'
import { resetSavedGameSessions } from '../shared/useGameLoop'
import { createVRally } from './vrally'
import { SCREEN_HEIGHT, SCREEN_WIDTH, renderVRally } from './vrallyRender'
import { VRallyPage } from './VRallyPage'

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

describe('renderVRally', () => {
  it('dibuja la escena a color dentro de la pantalla chica del T290', () => {
    const rects = renderVRally(createVRally(Math.random))

    expect(rects.length).toBeGreaterThan(SCREEN_HEIGHT)
    expect(rects.every((rect) => rect.color)).toBe(true)
    expect(new Set(rects.map((rect) => rect.color)).size).toBeGreaterThan(6)
    expect(rects.every((rect) => rect.y >= 0 && rect.y < SCREEN_HEIGHT)).toBe(true)
    expect(SCREEN_WIDTH).toBeGreaterThan(SCREEN_HEIGHT)
  })
})

describe('VRallyPage', () => {
  it('muestra la escena, el cronómetro y el mejor tiempo con décimas', () => {
    localStorage.setItem(localRecordStorageKey('vrally'), '754')

    render(<VRallyPage />)

    expect(screen.getByTestId('game-screen')).toHaveClass('lcd-ericsson-t290')
    expect(screen.getByRole('img', { name: 'V-Rally' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tiempo')).toHaveTextContent('0:00.0')
    expect(screen.getByLabelText('Mejor tiempo')).toHaveTextContent('1:15.4')
  })

  it('el ranking muestra tiempos con décimas y gana el menor', () => {
    expect(VRALLY_GAME.metric).toBe('lowest')
    expect(formatGameValue(VRALLY_GAME, 612)).toBe('1:01.2')
  })

  it('arranca con un toque o una flecha', () => {
    const { unmount } = render(<VRallyPage />)
    fireEvent.touchStart(screen.getByTestId('game-screen'), { touches: [{ clientX: 1, clientY: 1 }] })
    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
    unmount()

    resetSavedGameSessions()
    render(<VRallyPage />)
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })
})
