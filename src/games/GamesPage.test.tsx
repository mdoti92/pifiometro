import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { GamesPage } from './GamesPage'

describe('GamesPage', () => {
  it('lista los juegos del catálogo en orden, con link a su pantalla', () => {
    render(
      <MemoryRouter>
        <GamesPage />
      </MemoryRouter>,
    )

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveTextContent('Viborita')
    expect(links[0]).toHaveAttribute('href', '/games/snake')
    expect(links[1]).toHaveTextContent('Spring Ball')
    expect(links[1]).toHaveAttribute('href', '/games/spring-ball')
    expect(links[2]).toHaveTextContent('Small Bee')
    expect(links[3]).toHaveTextContent('Flappy Bird')
    expect(links[4]).toHaveTextContent('Tetris')
    expect(links[5]).toHaveTextContent('Penales')
    expect(links[6]).toHaveTextContent('Buscaminas')
    expect(links[7]).toHaveTextContent('2048')
    expect(links[8]).toHaveTextContent('Pong')
    expect(links[9]).toHaveTextContent('Dino')
  })
})
