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
  animationFrame: true,
}

const RESULT_MESSAGES: Record<Outcome, string> = {
  goal: '¡GOL!',
  saved: '¡ATAJÓ!',
  out: '¡AFUERA!',
}

const RULES = 'Tocá cuando la mira esté donde querés patear. Si el arquero adivina el lado, ataja.'

const kick = (state: PenaltiesState) => shoot(state, Math.random)

export function PenaltiesPage() {
  const { state, status, countdown, tap, touchHandlers } = useTapGame(PENALTIES_ENGINE, { action: kick, keys: [' '] })
  const { record } = useGameRecord(PENALTIES_GAME, status === 'over', state.goals)
  const rects = useMemo(() => toScreenRects(state), [state])

  // El resultado se muestra recién cuando termina la animación del remate.
  const resultShown = state.phase === 'result' && state.outcome !== null
  let message: string | null | undefined
  if (status === 'running') message = resultShown && state.outcome ? RESULT_MESSAGES[state.outcome] : null
  else if (status === 'over' && state.outcome) message = RESULT_MESSAGES[state.outcome]

  return (
    <GameScreen
      game={PENALTIES_GAME}
      palette="nokia"
      status={status}
      countdown={countdown}
      hud={[
        { label: 'Goles seguidos', prefix: 'GOLES', value: String(state.goals) },
        { label: 'Récord', prefix: 'HI', value: String(record ?? 0) },
      ]}
      boardAspect={VIEW_WIDTH / VIEW_HEIGHT}
      onPress={tap}
      touchHandlers={touchHandlers}
      message={message}
      overDetail={<span>Game Over · {state.goals} goles seguidos</span>}
      detail={status === 'idle' ? <span className="game-rules">{RULES}</span> : undefined}
      hint="Tocá la pantalla (o espacio) para patear. Muerte súbita: el primero que errás, perdés."
    >
      <PixelCanvas width={VIEW_WIDTH} height={VIEW_HEIGHT} rects={rects} label={PENALTIES_GAME.name} />
    </GameScreen>
  )
}
