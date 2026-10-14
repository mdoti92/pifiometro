import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MAX_BOUNCE_ANGLE, bounceOffPaddle, movePaddle, usePaddleControl, type PaddleInput } from './paddle'

describe('movePaddle', () => {
  it('con flechas se mueve a velocidad fija sin salirse', () => {
    expect(movePaddle(10, { target: null, hold: 1 }, { width: 8, fieldWidth: 48, speed: 2 })).toBe(12)
    expect(movePaddle(0, { target: null, hold: -1 }, { width: 8, fieldWidth: 48, speed: 2 })).toBe(0)
    expect(movePaddle(40, { target: null, hold: 1 }, { width: 8, fieldWidth: 48, speed: 2 })).toBe(40)
  })

  it('arrastrando sigue la posición del dedo (centrada) sin salirse', () => {
    const options = { width: 8, fieldWidth: 48, speed: 2 }

    expect(movePaddle(0, { target: 0.5, hold: 0 }, options)).toBe(20)
    expect(movePaddle(0, { target: 1, hold: 0 }, options)).toBe(40)
  })
})

describe('bounceOffPaddle', () => {
  it('en el centro rebota derecho y más rápido', () => {
    const velocity = bounceOffPaddle({ ballCenterX: 14, paddleX: 10, paddleWidth: 8, speed: 1, upward: true })

    expect(velocity.vx).toBeCloseTo(0)
    expect(velocity.vy).toBeCloseTo(-1)
  })

  it('cuanto más cerca del borde, más abierto el ángulo', () => {
    const nearEdge = bounceOffPaddle({ ballCenterX: 17.5, paddleX: 10, paddleWidth: 8, speed: 1, upward: true })
    const nearCenter = bounceOffPaddle({ ballCenterX: 15, paddleX: 10, paddleWidth: 8, speed: 1, upward: true })

    expect(nearEdge.vx).toBeGreaterThan(nearCenter.vx)
    expect(Math.atan2(nearEdge.vx, -nearEdge.vy)).toBeLessThanOrEqual(MAX_BOUNCE_ANGLE + 1e-9)
  })

  it('puede rebotar hacia abajo (paleta de arriba)', () => {
    expect(bounceOffPaddle({ ballCenterX: 14, paddleX: 10, paddleWidth: 8, speed: 1, upward: false }).vy).toBeCloseTo(1)
  })
})

function Field({ onRead }: { onRead: (read: () => PaddleInput) => void }) {
  const { read, touchHandlers } = usePaddleControl()
  onRead(read)
  return <div data-testid="field" {...touchHandlers} />
}

describe('usePaddleControl', () => {
  it('lee la posición del dedo como fracción del ancho y la suelta al levantar', () => {
    let read: () => PaddleInput = () => ({ target: null, hold: 0 })
    render(<Field onRead={(r) => (read = r)} />)
    const field = screen.getByTestId('field')
    vi.spyOn(field, 'getBoundingClientRect').mockReturnValue({ left: 100, width: 200 } as DOMRect)

    fireEvent.touchStart(field, { touches: [{ clientX: 150, clientY: 0 }] })
    expect(read().target).toBeCloseTo(0.25)
    fireEvent.touchMove(field, { touches: [{ clientX: 250, clientY: 0 }] })
    expect(read().target).toBeCloseTo(0.75)
    fireEvent.touchEnd(field, { touches: [] })
    expect(read().target).toBeNull()
  })

  it('lee las flechas mantenidas', () => {
    let read: () => PaddleInput = () => ({ target: null, hold: 0 })
    render(<Field onRead={(r) => (read = r)} />)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    })

    expect(read().hold).toBe(1)
  })
})
