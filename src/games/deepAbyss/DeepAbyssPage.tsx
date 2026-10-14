import { useCallback, useEffect, useMemo, useRef, type SyntheticEvent } from 'react'
import { DEEP_ABYSS_GAME } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import { PixelCanvas } from '../shared/PixelCanvas'
import { useGameLoop, type GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import {
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  STEP_MS,
  advanceLevel,
  createDeepAbyss,
  stepDeepAbyss,
  type AbyssInput,
  type DeepAbyssState,
} from './deepAbyss'
import { renderDeepAbyss } from './deepAbyssRender'
import { useAbyssControls, type ButtonKind } from './abyssControls'
import { LEVELS } from './levels'

const DEEP_ABYSS_ENGINE: GameEngine<DeepAbyssState, AbyssInput> = {
  key: DEEP_ABYSS_GAME.key,
  create: (random) => createDeepAbyss(random, LEVELS),
  step: stepDeepAbyss,
  isOver: (state) => state.isOver,
  intervalMs: () => STEP_MS,
  animationFrame: true,
}

function ControlButton({ kind, label, symbol, onChange }: { kind: ButtonKind; label: string; symbol: string; onChange: (kind: ButtonKind, pressed: boolean) => void }) {
  // Los botones manejan su propio toque: no tiene que llegar a la pantalla del juego.
  const press = (event: SyntheticEvent) => {
    event.stopPropagation()
    onChange(kind, true)
  }
  const release = (event: SyntheticEvent) => {
    event.stopPropagation()
    onChange(kind, false)
  }
  return (
    <button
      type="button"
      className={`abyss-button abyss-button-${kind}`}
      aria-label={label}
      onTouchStart={press}
      onTouchEnd={release}
      onTouchCancel={release}
      onMouseDown={press}
      onMouseUp={release}
      onMouseLeave={release}
      onClick={(event) => event.stopPropagation()}
    >
      {symbol}
    </button>
  )
}

export function DeepAbyssPage() {
  // Los controles arrancan el juego y el loop lee los controles: se cruzan a través de un ref.
  const startRef = useRef(() => {})
  const controls = useAbyssControls(useCallback(() => startRef.current(), []))
  const { state, status, press, act } = useGameLoop(DEEP_ABYSS_ENGINE, { readInput: controls.read })
  const waitingNextLevel = state.phase === 'levelComplete'
  // Un toque arranca, reanuda o reinicia; entre niveles, pasa al siguiente.
  const startIfNeeded = useCallback(() => {
    if (status !== 'running') press()
    else if (waitingNextLevel) act(advanceLevel)
  }, [status, press, act, waitingNextLevel])

  useEffect(() => {
    startRef.current = startIfNeeded
  }, [startIfNeeded])

  const { record } = useGameRecord(DEEP_ABYSS_GAME, status === 'over', state.score)
  const rects = useMemo(() => renderDeepAbyss(state), [state])

  const levelNumber = state.levelIndex + 1
  let message: string | undefined
  if (status === 'over') message = state.phase === 'won' ? '¡Llegaste al fondo!' : 'Game Over'
  else if (waitingNextLevel) message = `Nivel ${levelNumber} completo`

  return (
    <GameScreen
      game={DEEP_ABYSS_GAME}
      palette="t290"
      status={status}
      hud={[
        { label: 'Gemas', prefix: '◆', value: String(state.gems) },
        { label: 'Cofres', prefix: '▣', value: String(state.chests) },
        { label: 'Puntaje', value: String(state.score) },
        { label: 'Vidas', prefix: '♥', value: String(state.lives) },
        { label: 'Nivel', value: `N${levelNumber}` },
        { label: 'Récord', prefix: 'HI', value: String(record ?? 0) },
      ]}
      boardAspect={SCREEN_WIDTH / SCREEN_HEIGHT}
      onPress={startIfNeeded}
      touchHandlers={{ onTouchStart: startIfNeeded }}
      message={message}
      overDetail={<span>Puntaje {state.score}</span>}
      detail={waitingNextLevel ? <span>Puntaje {state.score} · tocá para seguir</span> : undefined}
      controls={
        <div className="abyss-controls">
          <div className="abyss-controls-move">
            <ControlButton kind="left" label="Izquierda" symbol="◀" onChange={controls.setButton} />
            <ControlButton kind="right" label="Derecha" symbol="▶" onChange={controls.setButton} />
          </div>
          <ControlButton kind="jump" label="Saltar" symbol="Saltar" onChange={controls.setButton} />
        </div>
      }
      hint="Bajá hasta la salida. Saltá sobre las burbujas para cruzar la lava. (← → y espacio en la compu)"
    >
      <PixelCanvas width={SCREEN_WIDTH} height={SCREEN_HEIGHT} rects={rects} label={DEEP_ABYSS_GAME.name} />
    </GameScreen>
  )
}
