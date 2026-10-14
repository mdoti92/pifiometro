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
  const paddle = { paddleX: 10, paddleWidth: 8, speed: 1 }
  const angleOf = ({ vx, vy }: { vx: number; vy: number }) => Math.atan2(vx, Math.abs(vy))
  // Viene bajando en diagonal de izquierda a derecha, a 30° de la vertical.
  const diagonal = { vx: Math.sin(Math.PI / 6), vy: Math.cos(Math.PI / 6) }

  it('en el centro refleja la dirección con que venía (mismo ángulo)', () => {
    const out = bounceOffPaddle({ ...paddle, ballCenterX: 14, upward: true, incoming: diagonal })

    expect(out.vy).toBeLessThan(0)
    expect(angleOf(out)).toBeCloseTo(Math.PI / 6)
    expect(Math.hypot(out.vx, out.vy)).toBeCloseTo(1)
  })

  it('viniendo de izquierda a derecha, pegar en el lado izquierdo le resta inclinación', () => {
    const leftEdge = bounceOffPaddle({ ...paddle, ballCenterX: 10.2, upward: true, incoming: diagonal })
    const leftHalf = bounceOffPaddle({ ...paddle, ballCenterX: 12, upward: true, incoming: diagonal })

    expect(Math.abs(angleOf(leftEdge))).toBeLessThan(Math.PI / 12)
    expect(angleOf(leftHalf)).toBeGreaterThan(0)
    expect(angleOf(leftHalf)).toBeLessThan(Math.PI / 6)
  })

  it('pegar en el lado derecho le suma inclinación hacia la derecha, sin pasar el máximo', () => {
    const rightEdge = bounceOffPaddle({ ...paddle, ballCenterX: 17.8, upward: true, incoming: diagonal })

    expect(angleOf(rightEdge)).toBeGreaterThan(Math.PI / 6)
    expect(angleOf(rightEdge)).toBeLessThanOrEqual(MAX_BOUNCE_ANGLE + 1e-9)
  })

  it('una pelota que viene vertical y pega en un borde sale inclinada hacia ese lado', () => {
    const straight = { vx: 0, vy: 1 }

    expect(bounceOffPaddle({ ...paddle, ballCenterX: 10.5, upward: true, incoming: straight }).vx).toBeLessThan(0)
    expect(bounceOffPaddle({ ...paddle, ballCenterX: 17.5, upward: true, incoming: straight }).vx).toBeGreaterThan(0)
  })

  it('puede rebotar hacia abajo (paleta de arriba)', () => {
    const out = bounceOffPaddle({ ...paddle, ballCenterX: 14, upward: false, incoming: { vx: 0, vy: -1 } })

    expect(out.vy).toBeCloseTo(1)
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
