import { describe, expect, it } from 'vitest'
import { MAX_SPEED, RIVALS, createVRally, type VRallyState } from './vrally'
import { POSITION_COLOR, renderHud } from './vrallyHud'
import { CLOUD_COLOR, DUST_COLOR, SIGN_COLOR, renderVRally } from './vrallyRender'

function state(overrides: Partial<VRallyState> = {}): VRallyState {
  return { ...createVRally(() => 0.5), ...overrides }
}

const colors = (rects: { color?: string }[]) => new Set(rects.map((rect) => rect.color))

describe('dibujo de rivales y escena', () => {
  it('dibuja los rivales que van adelante a la vista, con su color', () => {
    const first = RIVALS[0]
    const visible = renderVRally(state({ rivals: RIVALS.map((_, i) => ({ position: i === 0 ? 3000 : 999999, speed: 0 })) }))

    expect(colors(visible).has(first.color)).toBe(true)
  })

  it('no dibuja rivales que quedaron atrás', () => {
    const behind = renderVRally(state({ position: 50000, rivals: RIVALS.map(() => ({ position: 100, speed: 0 })) }))

    expect(RIVALS.some((rival) => colors(behind).has(rival.color))).toBe(false)
  })

  it('hay nubes en el cielo y carteles al costado de la ruta', () => {
    const rects = renderVRally(state())

    expect(colors(rects).has(CLOUD_COLOR)).toBe(true)
    const anyStretchWithSign = [0, 20000, 40000, 60000].some((position) =>
      colors(renderVRally(state({ position }))).has(SIGN_COLOR),
    )
    expect(anyStretchWithSign).toBe(true)
  })

  it('levanta polvo al ir por el pasto con velocidad', () => {
    const offroad = renderVRally(state({ playerX: 1.5, speed: MAX_SPEED / 2 }))
    const onroad = renderVRally(state({ playerX: 0, speed: MAX_SPEED / 2 }))

    expect(colors(offroad).has(DUST_COLOR)).toBe(true)
    expect(colors(onroad).has(DUST_COLOR)).toBe(false)
  })

  it('el HUD muestra la posición en carrera', () => {
    expect(colors(renderHud(state())).has(POSITION_COLOR)).toBe(true)
  })
})
