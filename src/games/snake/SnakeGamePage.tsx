import { useEffect, useRef, type TouchEvent } from 'react'
import { SNAKE_GAME } from '../catalog'
import { RankingLauncher } from '../ranking/RankingLauncher'
import { useGameRanking } from '../ranking/useGameRanking'
import { BOARD_COLUMNS, BOARD_ROWS, type Cell } from './snakeGame'
import { directionFromKey, directionFromSwipe } from './snakeInput'
import { useSnakeGame, type SnakeStatus } from './useSnakeGame'

const STATUS_MESSAGES: Record<SnakeStatus, string | null> = {
  idle: 'Tocá para jugar',
  running: null,
  paused: 'Pausa — tocá para seguir',
  over: 'Game Over',
}

function cellKey({ x, y }: Cell): string {
  return `${x},${y}`
}

export function SnakeGamePage() {
  const { game, status, highScore, press, steer } = useSnakeGame()
  const { remoteBest, reportResult } = useGameRanking(SNAKE_GAME)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const record = Math.max(highScore, remoteBest ?? 0)

  useEffect(() => {
    if (status === 'over') reportResult(game.score)
  }, [status, game.score, reportResult])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const direction = directionFromKey(event.key)
      if (!direction) return
      event.preventDefault()
      steer(direction)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [steer])

  function handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd(event: TouchEvent) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return

    const touch = event.changedTouches[0]
    const direction = directionFromSwipe(touch.clientX - start.x, touch.clientY - start.y)
    if (direction) steer(direction)
    else press()
  }

  const snakeCells = new Set(game.snake.map(cellKey))
  const foodKey = cellKey(game.food)
  const message = STATUS_MESSAGES[status]

  const cells = []
  for (let y = 0; y < BOARD_ROWS; y++) {
    for (let x = 0; x < BOARD_COLUMNS; x++) {
      const key = cellKey({ x, y })
      const kind = snakeCells.has(key) ? ' is-snake' : key === foodKey ? ' is-food' : ''
      cells.push(<div key={key} data-testid="snake-cell" className={`snake-cell${kind}`} />)
    }
  }

  return (
    <div
      className="snake-screen lcd-nokia-unlit"
      data-testid="snake-screen"
      onClick={press}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="snake-device">
        <div className="snake-hud">
          <span aria-label="Puntaje">{String(game.score).padStart(4, '0')}</span>
          <span>
            HI <span aria-label="Récord">{String(record).padStart(4, '0')}</span>
          </span>
        </div>
        <div
          className="snake-board"
          style={{ gridTemplateColumns: `repeat(${BOARD_COLUMNS}, 1fr)`, aspectRatio: `${BOARD_COLUMNS} / ${BOARD_ROWS}` }}
        >
          {cells}
          {message && (
            <div className="snake-message" role="status">
              <span>{message}</span>
              {status === 'over' && <span>Puntaje {game.score}</span>}
            </div>
          )}
        </div>
      </div>
      <RankingLauncher game={SNAKE_GAME} showButton={status !== 'running'} />
      <p className="snake-hint">Deslizá en cualquier parte de la pantalla (o usá las flechas)</p>
    </div>
  )
}
