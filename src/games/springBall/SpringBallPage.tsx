import { useMemo, type TouchEvent } from 'react'
import { SPRING_BALL_GAME } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import { ARROW_KEYS, useHorizontalHold, useWindowKeys, type Horizontal } from '../shared/input'
import { PixelCanvas } from '../shared/PixelCanvas'
import { useGameLoop, type GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import {
  TICK_MS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  createSpringBall,
  stepSpringBall,
  toScreenRects,
  type SpringBallState,
} from './springBall'

const SPRING_BALL_ENGINE: GameEngine<SpringBallState, Horizontal> = {
  key: SPRING_BALL_GAME.key,
  create: createSpringBall,
  step: stepSpringBall,
  isOver: (state) => state.isOver,
  intervalMs: () => TICK_MS,
}

export function SpringBallPage() {
  const hold = useHorizontalHold()
  const { state, status, press } = useGameLoop(SPRING_BALL_ENGINE, { readInput: hold.read })
  const { record } = useGameRecord(SPRING_BALL_GAME, status === 'over', state.score)
  const rects = useMemo(() => toScreenRects(state), [state])

  useWindowKeys(ARROW_KEYS, () => {
    if (status !== 'running') press()
  })

  function handleTouchStart(event: TouchEvent) {
    if (status !== 'running') press()
    hold.touchHandlers.onTouchStart(event)
  }

  return (
    <GameScreen
      game={SPRING_BALL_GAME}
      palette="c115"
      status={status}
      hud={[
        { label: 'Puntaje', value: String(state.score) },
        { label: 'Récord', prefix: 'HI', value: String(record ?? 0) },
      ]}
      onPress={press}
      touchHandlers={{ ...hold.touchHandlers, onTouchStart: handleTouchStart }}
      overDetail={<span>Puntaje {state.score}</span>}
      hint="Mantené tocada la mitad izquierda o derecha (o las flechas ← →)"
    >
      <PixelCanvas width={VIEW_WIDTH} height={VIEW_HEIGHT} rects={rects} label={SPRING_BALL_GAME.name} />
    </GameScreen>
  )
}
