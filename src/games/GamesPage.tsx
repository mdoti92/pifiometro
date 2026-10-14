import { Link } from 'react-router-dom'

const GAMES = [{ path: '/games/snake', name: 'Viborita', description: 'La del Nokia 1100, de toda la vida' }]

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
