import { useMemo } from 'react'
import { SMALL_BEE_GAME } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import type { Horizontal } from '../shared/input'
import { PixelCanvas } from '../shared/PixelCanvas'
import type { GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import { useHoldGame } from '../shared/useHoldGame'
import {
  TICK_MS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  createSmallBee,
  stepSmallBee,
  toScreenRects,
  type SmallBeeState,
} from './smallBee'

const SMALL_BEE_ENGINE: GameEngine<SmallBeeState, Horizontal> = {
  key: SMALL_BEE_GAME.key,
  create: createSmallBee,
  step: stepSmallBee,
  isOver: (state) => state.isOver,
  intervalMs: () => TICK_MS,
  animationFrame: true,
}

export function SmallBeePage() {
  const { state, status, countdown, press, touchHandlers } = useHoldGame(SMALL_BEE_ENGINE)
  const { record } = useGameRecord(SMALL_BEE_GAME, status === 'over', state.score)
  const rects = useMemo(() => toScreenRects(state), [state])

  return (
    <GameScreen
      game={SMALL_BEE_GAME}
      palette="c115"
      status={status}
      countdown={countdown}
      hud={[
        { label: 'Puntaje', value: String(state.score) },
        { label: 'Vidas', prefix: '♥', value: String(state.lives) },
        { label: 'Récord', prefix: 'HI', value: String(record ?? 0) },
      ]}
      boardAspect={VIEW_WIDTH / VIEW_HEIGHT}
      onPress={press}
      touchHandlers={touchHandlers}
      overDetail={<span>Puntaje {state.score}</span>}
      hint="Mantené tocada la mitad izquierda o derecha (o las flechas ← →). La abeja dispara sola."
    >
      <PixelCanvas width={VIEW_WIDTH} height={VIEW_HEIGHT} rects={rects} label={SMALL_BEE_GAME.name} />
    </GameScreen>
  )
}
