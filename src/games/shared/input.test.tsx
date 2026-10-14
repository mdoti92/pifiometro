import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MIN_SWIPE_DISTANCE_PX, useHorizontalHold, useSwipeHandlers, useWindowKeys } from './input'

function keyDown(key: string, repeat = false) {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, repeat })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

function keyUp(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { key }))
  })
}

describe('useWindowKeys', () => {
  it('avisa las teclas que maneja y evita el scroll', () => {
    const onKeyDown = vi.fn()
    renderHook(() => useWindowKeys(['ArrowUp'], onKeyDown))

    const handled = keyDown('ArrowUp')
    const ignored = keyDown('a')

    expect(onKeyDown).toHaveBeenCalledWith('ArrowUp', false)
    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(handled.defaultPrevented).toBe(true)
    expect(ignored.defaultPrevented).toBe(false)
  })

  it('deja de escuchar al desmontar', () => {
    const onKeyDown = vi.fn()
    const { unmount } = renderHook(() => useWindowKeys(['ArrowUp'], onKeyDown))
    unmount()

    expect(keyDown('ArrowUp').defaultPrevented).toBe(false)
    expect(onKeyDown).not.toHaveBeenCalled()
  })
})

function SwipeArea({ onSwipe, onTap }: { onSwipe: (d: string) => void; onTap: () => void }) {
  const handlers = useSwipeHandlers({ onSwipe, onTap })
  return <div data-testid="area" {...handlers} />
}

describe('useSwipeHandlers', () => {
  it('distingue un swipe de un toque', () => {
    const onSwipe = vi.fn()
    const onTap = vi.fn()
    render(<SwipeArea onSwipe={onSwipe} onTap={onTap} />)
    const area = screen.getByTestId('area')

    fireEvent.touchStart(area, { touches: [{ clientX: 0, clientY: 0 }] })
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: MIN_SWIPE_DISTANCE_PX * 2, clientY: 0 }] })
    fireEvent.touchStart(area, { touches: [{ clientX: 0, clientY: 0 }] })
    fireEvent.touchEnd(area, { changedTouches: [{ clientX: 2, clientY: 1 }] })

    expect(onSwipe).toHaveBeenCalledWith('right')
    expect(onTap).toHaveBeenCalledTimes(1)
  })
})

function HoldArea({ onRead }: { onRead: (read: () => number) => void }) {
  const { read, touchHandlers } = useHorizontalHold()
  onRead(read)
  return <div data-testid="hold" style={{ width: 200 }} {...touchHandlers} />
}

describe('useHorizontalHold', () => {
  it('lee la dirección mantenida con flechas', () => {
    let read: () => number = () => 0
    render(<HoldArea onRead={(r) => (read = r)} />)

    keyDown('ArrowLeft')
    expect(read()).toBe(-1)
    keyUp('ArrowLeft')
    expect(read()).toBe(0)
    keyDown('ArrowRight')
    expect(read()).toBe(1)
  })

  it('lee la mitad de la pantalla que se mantiene tocada', () => {
    let read: () => number = () => 0
    render(<HoldArea onRead={(r) => (read = r)} />)
    const area = screen.getByTestId('hold')
    vi.spyOn(area, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 200 } as DOMRect)

    fireEvent.touchStart(area, { touches: [{ clientX: 150, clientY: 10 }] })
    expect(read()).toBe(1)
    fireEvent.touchEnd(area, { touches: [], changedTouches: [{ clientX: 150, clientY: 10 }] })
    expect(read()).toBe(0)
    fireEvent.touchStart(area, { touches: [{ clientX: 20, clientY: 10 }] })
    expect(read()).toBe(-1)
  })
})
