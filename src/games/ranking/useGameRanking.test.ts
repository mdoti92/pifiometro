import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import type { GameDefinition } from '../catalog'
import { addPendingResult, loadPendingResult, localRecordStorageKey } from '../shared/localRecord'
import * as service from './gameScoresService'
import { useGameRanking } from './useGameRanking'

vi.mock('../../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../auth/AuthContext')>('../../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./gameScoresService', () => ({
  fetchMyBest: vi.fn(),
  submitGameResult: vi.fn(),
  fetchGameScores: vi.fn(),
}))

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedFetchMyBest = vi.mocked(service.fetchMyBest)
const mockedSubmit = vi.mocked(service.submitGameResult)

const SNAKE: GameDefinition = {
  key: 'snake',
  name: 'Viborita',
  description: '',
  path: '/games/snake',
  metric: 'highest',
  goal: '',
  howToPlay: '',
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockedUseAuth.mockReturnValue({ session: null, user: { id: 'u1' } as never, loading: false })
  mockedFetchMyBest.mockResolvedValue(null)
})

describe('useGameRanking', () => {
  it('al abrir trae la marca guardada en Supabase', async () => {
    mockedFetchMyBest.mockResolvedValue(15)

    const { result } = renderHook(() => useGameRanking(SNAKE))

    await waitFor(() => expect(result.current.remoteBest).toBe(15))
  })

  it('al abrir sube una vez el récord local si supera la marca remota', async () => {
    localStorage.setItem(localRecordStorageKey('snake'), '20')
    mockedFetchMyBest.mockResolvedValue(15)
    mockedSubmit.mockResolvedValue(20)

    const { result } = renderHook(() => useGameRanking(SNAKE))

    await waitFor(() => expect(result.current.remoteBest).toBe(20))
    expect(mockedSubmit).toHaveBeenCalledWith('u1', 'snake', 'highest', 20)
  })

  it('al abrir no sube nada si el récord local no supera la marca remota', async () => {
    localStorage.setItem(localRecordStorageKey('snake'), '10')
    mockedFetchMyBest.mockResolvedValue(15)

    const { result } = renderHook(() => useGameRanking(SNAKE))

    await waitFor(() => expect(result.current.remoteBest).toBe(15))
    expect(mockedSubmit).not.toHaveBeenCalled()
  })

  it('al abrir sube el resultado que quedó pendiente y lo limpia', async () => {
    const pong: GameDefinition = { ...SNAKE, key: 'pong', metric: 'cumulative' }
    addPendingResult('pong', 'cumulative', 2)
    mockedFetchMyBest.mockResolvedValue(3)
    mockedSubmit.mockResolvedValue(5)

    const { result } = renderHook(() => useGameRanking(pong))

    await waitFor(() => expect(result.current.remoteBest).toBe(5))
    expect(mockedSubmit).toHaveBeenCalledWith('u1', 'pong', 'cumulative', 2)
    expect(loadPendingResult('pong')).toBeNull()
  })

  it('reporta el resultado de una partida y actualiza la marca', async () => {
    mockedSubmit.mockResolvedValue(9)
    const { result } = renderHook(() => useGameRanking(SNAKE))
    await waitFor(() => expect(mockedFetchMyBest).toHaveBeenCalled())

    await act(() => result.current.reportResult(9))

    expect(mockedSubmit).toHaveBeenCalledWith('u1', 'snake', 'highest', 9)
    expect(result.current.remoteBest).toBe(9)
  })

  it('si falla el envío no se rompe y deja el resultado pendiente', async () => {
    mockedSubmit.mockRejectedValue(new Error('sin conexión'))
    const { result } = renderHook(() => useGameRanking(SNAKE))
    await waitFor(() => expect(mockedFetchMyBest).toHaveBeenCalled())

    await act(() => result.current.reportResult(7))

    expect(loadPendingResult('snake')).toBe(7)
  })

  it('si falla la carga inicial no se rompe', async () => {
    mockedFetchMyBest.mockRejectedValue(new Error('sin conexión'))

    const { result } = renderHook(() => useGameRanking(SNAKE))

    await waitFor(() => expect(mockedFetchMyBest).toHaveBeenCalled())
    expect(result.current.remoteBest).toBeNull()
  })
})
