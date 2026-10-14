import { useEffect, useRef } from 'react'

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

    context.clearRect(0, 0, width, height)
    const pixelColor = getComputedStyle(canvas).getPropertyValue('--lcd-pixel').trim() || '#000'
    for (const rect of rects) {
      context.fillStyle = rect.color ?? pixelColor
      context.fillRect(Math.round(rect.x), Math.round(rect.y), Math.round(rect.w), Math.round(rect.h))
    }
  }, [rects, width, height])

  return (
    <canvas
      ref={canvasRef}
      className="pixel-canvas"
      width={width}
      height={height}
      role="img"
      aria-label={label}
      style={{ aspectRatio: `${width} / ${height}` }}
    />
  )
}
