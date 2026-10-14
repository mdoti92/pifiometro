import { TETRIS_GAME } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import { ARROW_KEYS, useSwipeHandlers, useWindowKeys, type SwipeDirection } from '../shared/input'
import { useGameLoop, type GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  createTetris,
  hardDrop,
  intervalFor,
  move,
  pieceCells,
  previewCells,
  rotate,
  stepTetris,
  type PieceType,
  type TetrisState,
} from './tetris'

const PREVIEW_COLUMNS = 4
const PREVIEW_ROWS = 2

const TETRIS_ENGINE: GameEngine<TetrisState> = {
  key: TETRIS_GAME.key,
  create: createTetris,
  step: stepTetris,
  isOver: (state) => state.isOver,
  intervalMs: intervalFor,
}

function NextPiece({ type }: { type: PieceType }) {
  const filled = new Set(previewCells(type).map(([x, y]) => `${x},${y}`))
  const cells = []
  for (let y = 0; y < PREVIEW_ROWS; y++) {
    for (let x = 0; x < PREVIEW_COLUMNS; x++) {
      cells.push(<div key={`${x},${y}`} className={`tetris-cell${filled.has(`${x},${y}`) ? ' is-filled' : ''}`} />)
    }
  }
  return (
    <div className="tetris-aside">
      <span>PRÓX</span>
      <div className="tetris-preview" aria-label="Próxima pieza" style={{ gridTemplateColumns: `repeat(${PREVIEW_COLUMNS}, 1fr)` }}>
        {cells}
      </div>
    </div>
  )
}

export function TetrisPage() {
  const { state, status, countdown, press, act } = useGameLoop(TETRIS_ENGINE)
  const { record } = useGameRecord(TETRIS_GAME, status === 'over', state.score)

  function play(action: (current: TetrisState) => TetrisState) {
    if (status !== 'running') press()
    else act(action)
  }

  const drop = (current: TetrisState) => hardDrop(current, Math.random)

  useWindowKeys(ARROW_KEYS, (key, repeat) => {
    if (key === 'ArrowLeft') play((current) => move(current, -1))
    else if (key === 'ArrowRight') play((current) => move(current, 1))
    // Rotar y soltar no se encadenan manteniendo la tecla apretada.
    else if (repeat) return
    else if (key === 'ArrowUp') play(rotate)
    else play(drop)
  })

  const touchHandlers = useSwipeHandlers({
    onSwipe: (direction: SwipeDirection) => {
      if (direction === 'left') play((current) => move(current, -1))
      else if (direction === 'right') play((current) => move(current, 1))
      else if (direction === 'down') play(drop)
    },
    onTap: () => play(rotate),
  })

  const active = new Set(pieceCells(state.piece).map(([x, y]) => `${x},${y}`))
  const cells = []
  for (let y = 0; y < BOARD_ROWS; y++) {
    for (let x = 0; x < BOARD_COLUMNS; x++) {
      const filled = state.board[y][x] || active.has(`${x},${y}`)
      cells.push(<div key={`${x},${y}`} className={`tetris-cell${filled ? ' is-filled' : ''}`} />)
    }
  }

  return (
    <GameScreen
      game={TETRIS_GAME}
      palette="nokia"
      status={status}
      countdown={countdown}
      hud={[
        { label: 'Puntaje', value: String(state.score) },
        { label: 'Líneas', prefix: 'L', value: String(state.lines) },
        { label: 'Nivel', prefix: 'N', value: String(state.level) },
        { label: 'Récord', prefix: 'HI', value: String(record ?? 0) },
      ]}
      aside={<NextPiece type={state.next} />}
      boardAspect={BOARD_COLUMNS / BOARD_ROWS}
      onPress={() => play(rotate)}
      touchHandlers={touchHandlers}
      overDetail={<span>Puntaje {state.score}</span>}
      hint="Deslizá ← → para mover, tocá para rotar, deslizá ↓ para soltar (o flechas)"
    >
      <div className="tetris-board" style={{ gridTemplateColumns: `repeat(${BOARD_COLUMNS}, 1fr)` }}>
        {cells}
      </div>
    </GameScreen>
  )
}
