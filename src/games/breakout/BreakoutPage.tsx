import { useMemo, type TouchEvent } from 'react'
import { BREAKOUT_GAME } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import { useWindowKeys } from '../shared/input'
import { usePaddleControl, type PaddleInput } from '../shared/paddle'
import { PixelCanvas } from '../shared/PixelCanvas'
import type { GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import { useControlledGame } from '../shared/useHoldGame'
import {
  TICK_MS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  createBreakout,
  launch,
  stepBreakout,
  toScreenRects,
  type BreakoutState,
} from './breakout'

const BREAKOUT_ENGINE: GameEngine<BreakoutState, PaddleInput> = {
  key: BREAKOUT_GAME.key,
  create: createBreakout,
  step: stepBreakout,
  isOver: (state) => state.isOver,
  intervalMs: () => TICK_MS,
}

export function BreakoutPage() {
  const { state, status, press, act, touchHandlers } = useControlledGame(BREAKOUT_ENGINE, usePaddleControl())
  const { record } = useGameRecord(BREAKOUT_GAME, status === 'over', state.score)
  const rects = useMemo(() => toScreenRects(state), [state])

  function launchBall() {
    if (status !== 'running') press()
    act(launch)
  }

  useWindowKeys([' '], (_key, repeat) => {
    if (!repeat) launchBall()
  })

  function handleTouchStart(event: TouchEvent) {
    touchHandlers.onTouchStart(event)
    act(launch)
  }

  return (
    <GameScreen
      game={BREAKOUT_GAME}
      palette="nokia"
      status={status}
      hud={[
        { label: 'Puntaje', value: String(state.score) },
        { label: 'Vidas', prefix: '♥', value: String(state.lives) },
        { label: 'Récord', prefix: 'HI', value: String(record ?? 0) },
      ]}
      boardAspect={VIEW_WIDTH / VIEW_HEIGHT}
      onPress={launchBall}
      touchHandlers={{ ...touchHandlers, onTouchStart: handleTouchStart }}
      overDetail={<span>Puntaje {state.score}</span>}
      hint="Arrastrá el dedo para mover la paleta (o ← →). Tocá o espacio para lanzar la pelota."
    >
      <PixelCanvas width={VIEW_WIDTH} height={VIEW_HEIGHT} rects={rects} label={BREAKOUT_GAME.name} />
    </GameScreen>
  )
}
