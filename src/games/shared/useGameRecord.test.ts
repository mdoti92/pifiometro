import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import type { GameDefinition } from '../catalog'
import * as service from '../ranking/gameScoresService'
import { loadLocalRecord, localRecordStorageKey } from './localRecord'
import { useGameRecord } from './useGameRecord'

vi.mock('../../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../auth/AuthContext')>('../../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('../ranking/gameScoresService', () => ({
  fetchMyBest: vi.fn(),
  submitGameResult: vi.fn(),
  fetchGameScores: vi.fn(),
}))

const GAME: GameDefinition = { key: 'demo', name: 'Demo', description: '', path: '/games/demo', metric: 'highest' }
const TIMED: GameDefinition = { ...GAME, key: 'timed', metric: 'lowest' }

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({ session: null, user: { id: 'u1' } as never, loading: false })
  vi.mocked(service.fetchMyBest).mockResolvedValue(null)
  vi.mocked(service.submitGameResult).mockImplementation(async (_u, _k, _m, value) => value)
})

describe('useGameRecord', () => {
  it('al terminar guarda el récord local y lo reporta una sola vez', async () => {
    const { result, rerender } = renderHook(({ finished, value }) => useGameRecord(GAME, finished, value), {
      initialProps: { finished: false, value: 3 },
    })
    expect(result.current.record).toBeNull()

    rerender({ finished: true, value: 7 })
    rerender({ finished: true, value: 7 })

    await waitFor(() => expect(service.submitGameResult).toHaveBeenCalledTimes(1))
    expect(service.submitGameResult).toHaveBeenCalledWith('u1', 'demo', 'highest', 7)
    expect(loadLocalRecord('demo')).toBe(7)
    expect(result.current.record).toBe(7)
  })

  it('el récord mostrado es el mejor entre local y remoto según la métrica', async () => {
    localStorage.setItem(localRecordStorageKey('timed'), '40')
    vi.mocked(service.fetchMyBest).mockResolvedValue(30)

    const { result } = renderHook(() => useGameRecord(TIMED, false, 0))

    await waitFor(() => expect(result.current.record).toBe(30))
  })

  it('no reporta mientras la partida no terminó', () => {
    renderHook(() => useGameRecord(GAME, false, 9))

    expect(service.submitGameResult).not.toHaveBeenCalled()
  })

  it('con skipReport no reporta (ej. Buscaminas perdido)', () => {
    renderHook(() => useGameRecord(GAME, true, 9, { skipReport: true }))

    expect(service.submitGameResult).not.toHaveBeenCalled()
    expect(loadLocalRecord('demo')).toBeNull()
  })
})
