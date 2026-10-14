import { useState, type SyntheticEvent } from 'react'
import type { GameDefinition } from '../catalog'
import { RankingPanel } from './RankingPanel'

// Los juegos escuchan toques en toda la pantalla: el ranking no tiene que arrancar ni mover la partida.
function keepInside(event: SyntheticEvent) {
  event.stopPropagation()
}

export function RankingLauncher({ game, showButton }: { game: GameDefinition; showButton: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div onClick={keepInside} onTouchStart={keepInside} onTouchEnd={keepInside}>
      {showButton && (
        <button type="button" className="game-ranking-button" onClick={() => setOpen(true)}>
          Ranking
        </button>
      )}
      {open && <RankingPanel game={game} onClose={() => setOpen(false)} />}
    </div>
  )
}
