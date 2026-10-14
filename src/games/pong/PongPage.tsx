import { useEffect, useMemo } from 'react'
import { PONG_GAME } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import { usePaddleControl, type PaddleInput } from '../shared/paddle'
import { PixelCanvas } from '../shared/PixelCanvas'
import type { GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import { useControlledGame } from '../shared/useHoldGame'
import { TICK_MS, VIEW_HEIGHT, VIEW_WIDTH, createPong, stepPong, toScreenRects, type PongState } from './pong'

export const PONG_LOSSES_STORAGE_KEY = 'pifiometro.games.pong.losses'
const WIN_RESULT = 1

const PONG_ENGINE: GameEngine<PongState, PaddleInput> = {
  key: PONG_GAME.key,
  create: createPong,
  step: stepPong,
  isOver: (state) => state.isOver,
  intervalMs: () => TICK_MS,
  animationFrame: true,
}

function loadLosses(): number {
  const stored = Number(localStorage.getItem(PONG_LOSSES_STORAGE_KEY))
  return Number.isFinite(stored) && stored > 0 ? stored : 0
}

export function PongPage() {
  const { state, status, countdown, press, touchHandlers } = useControlledGame(PONG_ENGINE, usePaddleControl())
  const finished = status === 'over'
  const lost = finished && !state.playerWon
  // Los ganados son la marca acumulada del ranking; los perdidos solo se guardan en el dispositivo.
  const { record: wins } = useGameRecord(PONG_GAME, finished, WIN_RESULT, { skipReport: !state.playerWon })
  const rects = useMemo(() => toScreenRects(state), [state])

  useEffect(() => {
    if (lost) localStorage.setItem(PONG_LOSSES_STORAGE_KEY, String(loadLosses() + 1))
  }, [lost])

  const message = finished ? (state.playerWon ? '¡Ganaste!' : 'Perdiste') : undefined

  return (
    <GameScreen
      game={PONG_GAME}
      palette="nokia"
      status={status}
      countdown={countdown}
      hud={[
        { label: 'Mis puntos', prefix: 'VOS', value: String(state.playerScore) },
        { label: 'Puntos de la CPU', prefix: 'CPU', value: String(state.cpuScore) },
        { label: 'Partidos ganados', prefix: 'G', value: String(wins ?? 0) },
        { label: 'Partidos perdidos', prefix: 'P', value: String(loadLosses()) },
      ]}
      boardAspect={VIEW_WIDTH / VIEW_HEIGHT}
      onPress={press}
      touchHandlers={touchHandlers}
      message={message}
      overDetail={<span>{state.playerScore} a {state.cpuScore}</span>}
      hint="Arrastrá el dedo para mover tu paleta (o mantené ← →). Partido a 5."
    >
      <PixelCanvas width={VIEW_WIDTH} height={VIEW_HEIGHT} rects={rects} label={PONG_GAME.name} />
    </GameScreen>
  )
}
