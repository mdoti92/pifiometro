import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import * as service from '../ranking/gameScoresService'
import { MIN_SWIPE_DISTANCE_PX } from '../shared/input'
import { localRecordStorageKey } from '../shared/localRecord'
import { resetSavedGameSessions } from '../shared/useGameLoop'
import { Twenty48Page } from './Twenty48Page'
import { finishCountdown } from '../../test/gameCountdown'
import { GRID_SIZE } from './twenty48'

vi.mock('../../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../auth/AuthContext')>('../../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('../ranking/gameScoresService', () => ({
  fetchMyBest: vi.fn(),
  submitGameResult: vi.fn(),
  fetchGameScores: vi.fn(),
}))

function tileValues() {
  return Array.from(document.querySelectorAll('.twenty48-cell')).map((cell) => cell.textContent)
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

function startGame() {
  vi.useFakeTimers()
  render(<Twenty48Page />)
  fireEvent.click(screen.getByTestId('game-screen'))
  finishCountdown()
}

describe('Twenty48Page', () => {
  it('muestra la grilla de 4x4 con 2 fichas, puntaje y récord propio', () => {
    localStorage.setItem(localRecordStorageKey('2048'), '512')

    render(<Twenty48Page />)

    expect(screen.getByTestId('game-screen')).toHaveClass('lcd-nokia-unlit')
    expect(tileValues()).toHaveLength(GRID_SIZE * GRID_SIZE)
    expect(tileValues().filter(Boolean)).toHaveLength(2)
    expect(screen.getByLabelText('Puntaje')).toHaveTextContent('0')
    expect(screen.getByLabelText('Récord')).toHaveTextContent('512')
  })

  it('las flechas deslizan las fichas sin scrollear la página', () => {
    startGame()
    const before = tileValues().join('|')

    const moves = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].map((key) => {
      const event = new KeyboardEvent('keydown', { key, cancelable: true })
      act(() => {
        window.dispatchEvent(event)
      })
      return event
    })

    expect(moves.every((event) => event.defaultPrevented)).toBe(true)
    expect(tileValues().join('|')).not.toBe(before)
  })

  it('un swipe desliza las fichas', () => {
    startGame()
    const area = screen.getByTestId('game-screen')
    const before = tileValues().join('|')

    for (const [dx, dy] of [[-1, 0], [0, -1], [1, 0], [0, 1]]) {
      fireEvent.touchStart(area, { touches: [{ clientX: 100, clientY: 100 }] })
      fireEvent.touchEnd(area, {
        changedTouches: [{ clientX: 100 + dx * MIN_SWIPE_DISTANCE_PX * 2, clientY: 100 + dy * MIN_SWIPE_DISTANCE_PX * 2 }],
      })
    }

    expect(tileValues().join('|')).not.toBe(before)
  })
})
