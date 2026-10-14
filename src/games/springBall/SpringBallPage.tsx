import { useMemo } from 'react'
import { SPRING_BALL_GAME } from '../catalog'
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
  const { state, status, countdown, press, touchHandlers } = useHoldGame(SPRING_BALL_ENGINE)
  const { record } = useGameRecord(SPRING_BALL_GAME, status === 'over', state.score)
  const rects = useMemo(() => toScreenRects(state), [state])

  return (
    <GameScreen
      game={SPRING_BALL_GAME}
      palette="c115"
      status={status}
      countdown={countdown}
      hud={[
        { label: 'Puntaje', value: String(state.score) },
        { label: 'Récord', prefix: 'HI', value: String(record ?? 0) },
      ]}
      boardAspect={VIEW_WIDTH / VIEW_HEIGHT}
      onPress={press}
      touchHandlers={touchHandlers}
      overDetail={<span>Puntaje {state.score}</span>}
      hint="Mantené tocada la mitad izquierda o derecha (o las flechas ← →)"
    >
      <PixelCanvas width={VIEW_WIDTH} height={VIEW_HEIGHT} rects={rects} label={SPRING_BALL_GAME.name} />
    </GameScreen>
  )
}
