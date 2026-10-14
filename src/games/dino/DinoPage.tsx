import { useMemo } from 'react'
import { DINO_GAME } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import { PixelCanvas } from '../shared/PixelCanvas'
import type { GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import { useTapGame } from '../shared/useTapGame'
import { TICK_MS, VIEW_HEIGHT, VIEW_WIDTH, createDino, jump, stepDino, toScreenRects, type DinoState } from './dino'

const DINO_ENGINE: GameEngine<DinoState> = {
  key: DINO_GAME.key,
  create: createDino,
  step: stepDino,
  isOver: (state) => state.isOver,
  intervalMs: () => TICK_MS,
}

export function DinoPage() {
  const { state, status, countdown, tap, touchHandlers } = useTapGame(DINO_ENGINE, { action: jump })
  const { record } = useGameRecord(DINO_GAME, status === 'over', state.score)
  const rects = useMemo(() => toScreenRects(state), [state])

  return (
    <GameScreen
      game={DINO_GAME}
      palette="nokia"
      status={status}
      countdown={countdown}
      hud={[
        { label: 'Puntaje', value: String(state.score) },
        { label: 'Récord', prefix: 'HI', value: String(record ?? 0) },
      ]}
      boardAspect={VIEW_WIDTH / VIEW_HEIGHT}
      onPress={tap}
      touchHandlers={touchHandlers}
      overDetail={<span>Puntaje {state.score}</span>}
      hint="Tocá la pantalla para saltar (o espacio / ↑)"
    >
      <PixelCanvas width={VIEW_WIDTH} height={VIEW_HEIGHT} rects={rects} label={DINO_GAME.name} />
    </GameScreen>
  )
}
