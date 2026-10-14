import { useMemo } from 'react'
import { VRALLY_GAME, formatTenths } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import type { Horizontal } from '../shared/input'
import { PixelCanvas } from '../shared/PixelCanvas'
import type { GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import { useHoldGame } from '../shared/useHoldGame'
import { STEP_MS, createVRally, stepVRally, timeInTenths, type VRallyState } from './vrally'
import { SCREEN_HEIGHT, SCREEN_WIDTH, renderVRally } from './vrallyRender'

const VRALLY_ENGINE: GameEngine<VRallyState, Horizontal> = {
  key: VRALLY_GAME.key,
  create: createVRally,
  step: stepVRally,
  isOver: (state) => state.isOver,
  intervalMs: () => STEP_MS,
  animationFrame: true,
}

export function VRallyPage() {
  const { state, status, press, touchHandlers } = useHoldGame(VRALLY_ENGINE)
  const tenths = timeInTenths(state.elapsedMs)
  const { record } = useGameRecord(VRALLY_GAME, status === 'over', tenths)
  const rects = useMemo(() => renderVRally(state), [state])

  return (
    <GameScreen
      game={VRALLY_GAME}
      palette="t290"
      status={status}
      hud={[
        { label: 'Tiempo', value: formatTenths(tenths) },
        { label: 'Mejor tiempo', prefix: 'MEJOR', value: record === null ? '-:--.-' : formatTenths(record) },
      ]}
      boardAspect={SCREEN_WIDTH / SCREEN_HEIGHT}
      onPress={press}
      touchHandlers={touchHandlers}
      message={status === 'over' ? 'Llegada' : undefined}
      overDetail={<span>Tiempo {formatTenths(tenths)}</span>}
      hint="Mantené tocada la mitad izquierda o derecha (o ← →) para doblar. El auto acelera solo."
    >
      <PixelCanvas width={SCREEN_WIDTH} height={SCREEN_HEIGHT} rects={rects} label={VRALLY_GAME.name} />
    </GameScreen>
  )
}
