import { TWENTY48_GAME } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import { ARROW_KEYS, directionFromKey, useSwipeHandlers, useWindowKeys, type SwipeDirection } from '../shared/input'
import { useGameLoop, type GameEngine } from '../shared/useGameLoop'
import { useGameRecord } from '../shared/useGameRecord'
import { GRID_SIZE, continuePlaying, create2048, showsWinMessage, slide, type Twenty48State } from './twenty48'

// Juego por turnos: el loop no avanza nada solo, se usa por los estados y la pausa compartidos.
const NO_TICK_INTERVAL_MS = 60_000
const MAX_TONE = 4
const TILE_DOUBLINGS_PER_TONE = 3

const TWENTY48_ENGINE: GameEngine<Twenty48State> = {
  key: TWENTY48_GAME.key,
  create: create2048,
  step: (state) => state,
  isOver: (state) => state.isOver,
  intervalMs: () => NO_TICK_INTERVAL_MS,
}

function toneOf(value: number): number {
  return Math.min(Math.ceil(Math.log2(value) / TILE_DOUBLINGS_PER_TONE), MAX_TONE)
}

export function Twenty48Page() {
  const { state, status, countdown, press, act } = useGameLoop(TWENTY48_ENGINE)
  const { record } = useGameRecord(TWENTY48_GAME, status === 'over', state.score)
  const showingWin = showsWinMessage(state)

  function move(direction: SwipeDirection) {
    if (status !== 'running') press()
    act((current) => slide(current, direction, Math.random))
  }

  function tap() {
    if (status !== 'running') press()
    else if (showingWin) act(continuePlaying)
  }

  useWindowKeys(ARROW_KEYS, (key) => {
    const direction = directionFromKey(key)
    if (direction) move(direction)
  })

  const touchHandlers = useSwipeHandlers({ onSwipe: move, onTap: tap })

  let message: string | null | undefined = null
  if (status === 'over') message = undefined
  else if (showingWin) message = '¡Ganaste!'

  return (
    <GameScreen
      game={TWENTY48_GAME}
      palette="nokia"
      status={status}
      countdown={countdown}
      hud={[
        { label: 'Puntaje', value: String(state.score) },
        { label: 'Récord', prefix: 'HI', value: String(record ?? 0) },
      ]}
      onPress={tap}
      touchHandlers={touchHandlers}
      message={message}
      overDetail={<span>Puntaje {state.score}</span>}
      hint={showingWin ? 'Tocá para seguir jugando la misma partida' : 'Deslizá en cualquier dirección (o usá las flechas)'}
    >
      <div className="twenty48-board" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
        {state.grid.flatMap((row, y) =>
          row.map((value, x) => (
            <div key={`${x},${y}`} className={`twenty48-cell${value ? ` tone-${toneOf(value)}` : ''}`}>
              {value || ''}
            </div>
          )),
        )}
      </div>
    </GameScreen>
  )
}
