import { useMemo } from 'react'
import { FLAPPY_GAME } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import { PixelCanvas } from '../shared/PixelCanvas'
import type { GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import { useTapGame } from '../shared/useTapGame'
import { TICK_MS, VIEW_HEIGHT, VIEW_WIDTH, createFlappy, flap, stepFlappy, toScreenRects, type FlappyState } from './flappy'

const FLAPPY_ENGINE: GameEngine<FlappyState> = {
  key: FLAPPY_GAME.key,
  create: createFlappy,
  step: stepFlappy,
  isOver: (state) => state.isOver,
  intervalMs: () => TICK_MS,
}

export function FlappyPage() {
  const { state, status, tap, touchHandlers } = useTapGame(FLAPPY_ENGINE, { action: flap, actOnStart: true })
  const { record } = useGameRecord(FLAPPY_GAME, status === 'over', state.score)
  const rects = useMemo(() => toScreenRects(state), [state])

  return (
    <GameScreen
      game={FLAPPY_GAME}
      palette="nokia"
      status={status}
      hud={[
        { label: 'Puntaje', value: String(state.score) },
        { label: 'Récord', prefix: 'HI', value: String(record ?? 0) },
      ]}
      boardAspect={VIEW_WIDTH / VIEW_HEIGHT}
      onPress={tap}
      touchHandlers={touchHandlers}
      overDetail={<span>Puntaje {state.score}</span>}
      hint="Tocá la pantalla para aletear (o espacio / ↑)"
    >
      <PixelCanvas width={VIEW_WIDTH} height={VIEW_HEIGHT} rects={rects} label={FLAPPY_GAME.name} />
    </GameScreen>
  )
}
