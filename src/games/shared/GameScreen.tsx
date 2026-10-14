import { useRef, type CSSProperties, type ReactNode, type TouchEvent } from 'react'
import type { GameDefinition } from '../catalog'
import { RankingLauncher } from '../ranking/RankingLauncher'
import type { GameStatus } from './useGameLoop'

export type GamePalette = 'nokia' | 'c115' | 't290'

const PALETTE_CLASSES: Record<GamePalette, string> = {
  nokia: 'lcd-nokia-unlit',
  c115: 'lcd-motorola-c115',
  t290: 'lcd-ericsson-t290',
}

// Un toque dispara touchend y después un click sintético: se ignora ese click para no actuar dos veces.
const SYNTHETIC_CLICK_WINDOW_MS = 600

export interface HudItem {
  label: string
  value: string
  prefix?: string
}

type TouchHandler = (event: TouchEvent) => void

interface TouchHandlers {
  onTouchStart?: TouchHandler
  onTouchMove?: TouchHandler
  onTouchEnd?: TouchHandler
  onTouchCancel?: TouchHandler
}

interface GameScreenProps {
  game: GameDefinition
  palette: GamePalette
  status: GameStatus
  hud: HudItem[]
  onPress: () => void
  touchHandlers?: TouchHandlers
  /** Reemplaza el mensaje por defecto según el estado (null = sin mensaje). */
  message?: ReactNode | null
  overDetail?: ReactNode
  /** Detalle bajo el mensaje mientras la partida sigue (ej. entre niveles). */
  detail?: ReactNode
  hint: string
  boardStyle?: CSSProperties
  /** Proporción ancho/alto del tablero, para que entre entero en pantallas bajas. */
  boardAspect?: number
  /** Información extra entre el HUD y el tablero (ej. la próxima pieza). */
  aside?: ReactNode
  /** Controles en pantalla debajo del tablero (ej. botones de un juego de plataformas). */
  controls?: ReactNode
  children: ReactNode
}

const DEFAULT_MESSAGES: Record<GameStatus, string | null> = {
  idle: 'Tocá para jugar',
  running: null,
  paused: 'Pausa — tocá para seguir',
  over: 'Game Over',
}

export function GameScreen({
  game,
  palette,
  status,
  hud,
  onPress,
  touchHandlers = {},
  message,
  overDetail,
  detail,
  hint,
  boardStyle,
  boardAspect,
  aside,
  controls,
  children,
}: GameScreenProps) {
  const lastTouchEnd = useRef(0)
  const shownMessage = message === undefined ? DEFAULT_MESSAGES[status] : message

  function handleTouchEnd(event: TouchEvent) {
    lastTouchEnd.current = Date.now()
    touchHandlers.onTouchEnd?.(event)
  }

  function handleClick() {
    if (Date.now() - lastTouchEnd.current < SYNTHETIC_CLICK_WINDOW_MS) return
    onPress()
  }

  return (
    <div
      className={`game-screen ${PALETTE_CLASSES[palette]}`}
      data-testid="game-screen"
      onClick={handleClick}
      onTouchStart={touchHandlers.onTouchStart}
      onTouchMove={touchHandlers.onTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={touchHandlers.onTouchCancel}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="game-device" style={boardAspect ? ({ '--board-aspect': boardAspect } as CSSProperties) : undefined}>
        <div className="game-hud">
          {hud.map((item) => (
            <span key={item.label}>
              {item.prefix && `${item.prefix} `}
              <span aria-label={item.label}>{item.value}</span>
            </span>
          ))}
        </div>
        {aside}
        <div className="game-board" style={boardStyle}>
          {children}
          {shownMessage && (
            <div className="game-message" role="status">
              <span>{shownMessage}</span>
              {status === 'over' ? overDetail : detail}
            </div>
          )}
        </div>
        {controls}
      </div>
      <RankingLauncher game={game} showButton={status !== 'running'} />
      <p className="game-hint">{hint}</p>
    </div>
  )
}
