import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLiveNow } from './useLiveNow'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-01T20:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useLiveNow', () => {
  it('arranca con la hora actual', () => {
    const { result } = renderHook(() => useLiveNow(1000))

    expect(result.current.getTime()).toBe(new Date('2026-03-01T20:00:00Z').getTime())
  })

  it('se actualiza cada vez que pasa el intervalo indicado', () => {
    const { result } = renderHook(() => useLiveNow(1000))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.getTime()).toBe(new Date('2026-03-01T20:00:03Z').getTime())
  })
})
