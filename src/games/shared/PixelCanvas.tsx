import { useEffect, useRef } from 'react'

/**
 * Resolución interna del lienzo respecto de la lógica: los objetos se mueven en fracciones de píxel
 * lógico y el movimiento se ve fluido, sin perder el aspecto pixelado.
 */
export const RENDER_SCALE = 4

export interface PixelRect {
  x: number
  y: number
  w: number
  h: number
  /** Color propio (juegos a color); por defecto, el píxel del LCD de la paleta. */
  color?: string
}

interface PixelCanvasProps {
  width: number
  height: number
  rects: PixelRect[]
  label: string
}

/** Lienzo de baja resolución escalado sin suavizado: cada unidad lógica se ve como un píxel de LCD. */
export function PixelCanvas({ width, height, rects, label }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    context.clearRect(0, 0, width * RENDER_SCALE, height * RENDER_SCALE)
    const pixelColor = getComputedStyle(canvas).getPropertyValue('--lcd-pixel').trim() || '#000'
    for (const rect of rects) {
      context.fillStyle = rect.color ?? pixelColor
      context.fillRect(
        Math.round(rect.x * RENDER_SCALE),
        Math.round(rect.y * RENDER_SCALE),
        Math.round(rect.w * RENDER_SCALE),
        Math.round(rect.h * RENDER_SCALE),
      )
    }
  }, [rects, width, height])

  return (
    <canvas
      ref={canvasRef}
      className="pixel-canvas"
      width={width * RENDER_SCALE}
      height={height * RENDER_SCALE}
      role="img"
      aria-label={label}
      style={{ aspectRatio: `${width} / ${height}` }}
    />
  )
}
