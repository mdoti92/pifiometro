import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PixelCanvas, RENDER_SCALE } from './PixelCanvas'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PixelCanvas', () => {
  it('dibuja con resolución interna mayor para que el movimiento sea fluido en fracciones de píxel', () => {
    const fillRect = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      clearRect: vi.fn(),
      fillRect,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D)

    render(<PixelCanvas width={48} height={72} label="Juego" rects={[{ x: 10.25, y: 5.5, w: 2, h: 2 }]} />)

    const canvas = screen.getByRole('img', { name: 'Juego' }) as HTMLCanvasElement
    expect(RENDER_SCALE).toBeGreaterThan(1)
    expect(canvas.width).toBe(48 * RENDER_SCALE)
    expect(canvas.height).toBe(72 * RENDER_SCALE)
    expect(fillRect).toHaveBeenCalledWith(10.25 * RENDER_SCALE, 5.5 * RENDER_SCALE, 2 * RENDER_SCALE, 2 * RENDER_SCALE)
  })
})
