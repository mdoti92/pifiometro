import { useRef, type MouseEvent, type SyntheticEvent } from 'react'
import { MINESWEEPER_GAME, formatSeconds } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import { useGameLoop, type GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import {
  BOARD_SIZE,
  TIMER_INTERVAL_MS,
  createMinesweeper,
  isFinished,
  minesLeft,
  reveal,
  stepMinesweeper,
  toggleFlag,
  type MineCell,
  type MinesweeperState,
} from './minesweeper'

export const LONG_PRESS_MS = 450

const MINESWEEPER_ENGINE: GameEngine<MinesweeperState> = {
  key: MINESWEEPER_GAME.key,
  create: createMinesweeper,
  step: stepMinesweeper,
  isOver: isFinished,
  intervalMs: () => TIMER_INTERVAL_MS,
}

function cellContent(cell: MineCell): string {
  if (cell.revealed) return cell.mine ? '*' : cell.adjacent > 0 ? String(cell.adjacent) : ''
  return cell.flagged ? '⚑' : ''
}

export function MinesweeperPage() {
  const { state, status, press, act } = useGameLoop(MINESWEEPER_ENGINE)
  const { record } = useGameRecord(MINESWEEPER_GAME, isFinished(state), state.seconds, {
    skipReport: state.phase !== 'won',
  })
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)

  // Con la partida en pausa o terminada, el toque sigue hasta la pantalla para reanudar o reiniciar.
  const playable = status === 'idle' || status === 'running'

  function play(action: (current: MinesweeperState) => MinesweeperState) {
    if (status === 'idle') press()
    act(action)
  }

  function flag(x: number, y: number) {
    play((current) => toggleFlag(current, x, y))
  }

  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    longPressTimer.current = null
  }

  function handleClick(event: SyntheticEvent, x: number, y: number) {
    if (longPressFired.current) {
      longPressFired.current = false
      event.stopPropagation()
      return
    }
    if (!playable) return
    event.stopPropagation()
    play((current) => reveal(current, x, y, Math.random))
  }

  function handleContextMenu(event: MouseEvent, x: number, y: number) {
    event.preventDefault()
    if (!playable) return
    event.stopPropagation()
    flag(x, y)
  }

  function handleTouchStart(x: number, y: number) {
    longPressFired.current = false
    cancelLongPress()
    if (!playable) return
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      flag(x, y)
    }, LONG_PRESS_MS)
  }

  const message = status === 'over' ? (state.phase === 'won' ? '¡Ganaste!' : 'Game Over') : status === 'paused' ? undefined : null

  return (
    <GameScreen
      game={MINESWEEPER_GAME}
      palette="nokia"
      status={status}
      hud={[
        { label: 'Minas restantes', prefix: '⚑', value: String(minesLeft(state)) },
        { label: 'Tiempo', value: formatSeconds(state.seconds) },
        { label: 'Mejor tiempo', prefix: 'HI', value: record === null ? '-:--' : formatSeconds(record) },
      ]}
      onPress={press}
      message={message}
      overDetail={state.phase === 'won' ? <span>Tiempo {formatSeconds(state.seconds)}</span> : null}
      hint="Tocá para destapar. Mantené presionado (o click derecho) para poner una bandera."
    >
      <div className="minesweeper-board" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}>
        {state.cells.flatMap((row, y) =>
          row.map((cell, x) => (
            <button
              key={`${x},${y}`}
              type="button"
              className={`minesweeper-cell${cell.revealed ? ' is-revealed' : ''}`}
              aria-label={`Celda ${x + 1}, ${y + 1}`}
              data-revealed={cell.revealed}
              data-flagged={cell.flagged}
              onClick={(event) => handleClick(event, x, y)}
              onContextMenu={(event) => handleContextMenu(event, x, y)}
              onTouchStart={() => handleTouchStart(x, y)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              onTouchCancel={cancelLongPress}
            >
              {cellContent(cell)}
            </button>
          )),
        )}
      </div>
    </GameScreen>
  )
}
