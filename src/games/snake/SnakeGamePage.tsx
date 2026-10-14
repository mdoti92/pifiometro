import { SNAKE_GAME } from '../catalog'
import { GameScreen } from '../shared/GameScreen'
import { ARROW_KEYS, directionFromKey, useSwipeHandlers, useWindowKeys } from '../shared/input'
import { useGameRecord } from '../shared/useGameRecord'
import { BOARD_COLUMNS, BOARD_ROWS, type Cell } from './snakeGame'
import { useSnakeGame } from './useSnakeGame'

const SCORE_DIGITS = 4

function cellKey({ x, y }: Cell): string {
  return `${x},${y}`
}

function padScore(value: number): string {
  return String(value).padStart(SCORE_DIGITS, '0')
}

export function SnakeGamePage() {
  const { game, status, countdown, press, steer } = useSnakeGame()
  const { record } = useGameRecord(SNAKE_GAME, status === 'over', game.score)
  const touchHandlers = useSwipeHandlers({ onSwipe: steer, onTap: press })

  useWindowKeys(ARROW_KEYS, (key) => {
    const direction = directionFromKey(key)
    if (direction) steer(direction)
  })

  const snakeCells = new Set(game.snake.map(cellKey))
  const foodKey = cellKey(game.food)

  const cells = []
  for (let y = 0; y < BOARD_ROWS; y++) {
    for (let x = 0; x < BOARD_COLUMNS; x++) {
      const key = cellKey({ x, y })
      const kind = snakeCells.has(key) ? ' is-snake' : key === foodKey ? ' is-food' : ''
      cells.push(<div key={key} data-testid="snake-cell" className={`snake-cell${kind}`} />)
    }
  }

  return (
    <GameScreen
      game={SNAKE_GAME}
      palette="nokia"
      status={status}
      countdown={countdown}
      hud={[
        { label: 'Puntaje', value: padScore(game.score) },
        { label: 'Récord', prefix: 'HI', value: padScore(record ?? 0) },
      ]}
      onPress={press}
      touchHandlers={touchHandlers}
      overDetail={<span>Puntaje {game.score}</span>}
      hint="Deslizá en cualquier parte de la pantalla (o usá las flechas)"
    >
      <div
        className="snake-board"
        style={{ gridTemplateColumns: `repeat(${BOARD_COLUMNS}, 1fr)`, aspectRatio: `${BOARD_COLUMNS} / ${BOARD_ROWS}` }}
      >
        {cells}
      </div>
    </GameScreen>
  )
}
