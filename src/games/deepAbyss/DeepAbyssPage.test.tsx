import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import * as service from '../ranking/gameScoresService'
import { localRecordStorageKey } from '../shared/localRecord'
import { resetSavedGameSessions } from '../shared/useGameLoop'
import { useAbyssControls } from './abyssControls'
import { DeepAbyssPage } from './DeepAbyssPage'
import { createDeepAbyss } from './deepAbyss'
import { renderDeepAbyss } from './deepAbyssRender'
import { LEVELS } from './levels'

vi.mock('../../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../auth/AuthContext')>('../../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('../ranking/gameScoresService', () => ({
  fetchMyBest: vi.fn(),
  submitGameResult: vi.fn(),
  fetchGameScores: vi.fn(),
}))

function key(type: 'keydown' | 'keyup', value: string) {
  const event = new KeyboardEvent(type, { key: value, cancelable: true })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  resetSavedGameSessions()
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({ session: null, user: { id: 'u1' } as never, loading: false })
  vi.mocked(service.fetchMyBest).mockResolvedValue(null)
})

describe('useAbyssControls', () => {
  it('flechas mueven y espacio o ↑ saltan (el salto se consume una vez)', () => {
    const { result } = renderHook(() => useAbyssControls(vi.fn()))

    key('keydown', 'ArrowLeft')
    key('keydown', ' ')
    expect(result.current.read()).toEqual({ move: -1, jump: true })
    expect(result.current.read()).toEqual({ move: -1, jump: false })

    key('keyup', 'ArrowLeft')
    key('keydown', 'ArrowUp')
    expect(result.current.read()).toEqual({ move: 0, jump: true })
  })
})

describe('renderDeepAbyss', () => {
  it('dibuja la escena a color con el personaje', () => {
    const rects = renderDeepAbyss(createDeepAbyss(Math.random, LEVELS))

    expect(rects.every((rect) => rect.color)).toBe(true)
    expect(new Set(rects.map((rect) => rect.color)).size).toBeGreaterThan(6)
  })
})

describe('DeepAbyssPage', () => {
  it('muestra el nivel, el HUD con gemas, cofres, puntaje, 3 vidas y el récord propio', () => {
    localStorage.setItem(localRecordStorageKey('deep-abyss'), '480')

    render(<DeepAbyssPage />)

    expect(screen.getByTestId('game-screen')).toHaveClass('lcd-ericsson-t290')
    expect(screen.getByRole('img', { name: 'Deep Abyss' })).toBeInTheDocument()
    expect(screen.getByLabelText('Gemas')).toHaveTextContent('0')
    expect(screen.getByLabelText('Cofres')).toHaveTextContent('0')
    expect(screen.getByLabelText('Puntaje')).toHaveTextContent('0')
    expect(screen.getByLabelText('Vidas')).toHaveTextContent('3')
    expect(screen.getByLabelText('Récord')).toHaveTextContent('480')
    expect(screen.getByLabelText('Nivel')).toHaveTextContent('N1')
  })

  it('tiene botones en pantalla ◀ ▶ y Saltar que arrancan el juego sin scrollear', () => {
    render(<DeepAbyssPage />)

    expect(screen.getByRole('button', { name: 'Izquierda' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Derecha' })).toBeInTheDocument()
    fireEvent.touchStart(screen.getByRole('button', { name: 'Saltar' }), { touches: [{ clientX: 0, clientY: 0 }] })

    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })

  it('no muestra el menú contextual por long-press', () => {
    render(<DeepAbyssPage />)

    expect(fireEvent.contextMenu(screen.getByTestId('game-screen'))).toBe(false)
  })

  it('una flecha arranca el juego y evita el scroll', () => {
    render(<DeepAbyssPage />)

    expect(key('keydown', 'ArrowRight').defaultPrevented).toBe(true)
    expect(screen.queryByText(/tocá para jugar/i)).not.toBeInTheDocument()
  })
})
