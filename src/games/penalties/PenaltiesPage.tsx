import { useMemo } from 'react'
import { PENALTIES_GAME } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import { PixelCanvas } from '../shared/PixelCanvas'
import type { GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import { useTapGame } from '../shared/useTapGame'
import {
  TICK_MS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  createPenalties,
  shoot,
  stepPenalties,
  toScreenRects,
  type Outcome,
  type PenaltiesState,
} from './penalties'

const PENALTIES_ENGINE: GameEngine<PenaltiesState> = {
  key: PENALTIES_GAME.key,
  create: createPenalties,
  step: stepPenalties,
  isOver: (state) => state.isOver,
  intervalMs: () => TICK_MS,
}

const MISSED_MESSAGES: Record<Exclude<Outcome, 'goal'>, string> = {
  saved: '¡Atajado!',
  out: '¡Afuera!',
}

const kick = (state: PenaltiesState) => shoot(state, Math.random)

export function PenaltiesPage() {
  const { state, status, tap, touchHandlers } = useTapGame(PENALTIES_ENGINE, { action: kick, keys: [' '] })
  const { record } = useGameRecord(PENALTIES_GAME, status === 'over', state.goals)
  const rects = useMemo(() => toScreenRects(state), [state])

  let message: string | null | undefined
  if (status === 'running') message = state.outcome === 'goal' ? '¡GOL!' : null
  else if (status === 'over' && state.outcome && state.outcome !== 'goal') message = MISSED_MESSAGES[state.outcome]

  return (
    <GameScreen
      game={PENALTIES_GAME}
      palette="nokia"
      status={status}
      hud={[
        { label: 'Goles seguidos', prefix: 'GOLES', value: String(state.goals) },
        { label: 'Récord', prefix: 'HI', value: String(record ?? 0) },
      ]}
      boardAspect={VIEW_WIDTH / VIEW_HEIGHT}
      onPress={tap}
      touchHandlers={touchHandlers}
      message={message}
      overDetail={<span>Game Over · {state.goals} goles seguidos</span>}
      hint="Tocá la pantalla (o espacio) para patear cuando el indicador esté donde querés"
    >
      <PixelCanvas width={VIEW_WIDTH} height={VIEW_HEIGHT} rects={rects} label={PENALTIES_GAME.name} />
    </GameScreen>
  )
}
