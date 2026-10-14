import { Link } from 'react-router-dom'
import { GAMES } from './catalog'

export function GamesPage() {
  return (
    <section>
      <h1>Juegos</h1>
      <ul className="games-list">
        {GAMES.map((game) => (
          <li key={game.path}>
            <Link to={game.path} className="games-list-item">
              <strong>{game.name}</strong>
              <span>{game.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
