import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { GamesPage } from './GamesPage'

describe('GamesPage', () => {
  it('lista la Viborita como único juego, con link a su pantalla', () => {
    render(
      <MemoryRouter>
        <GamesPage />
      </MemoryRouter>,
    )

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveTextContent('Viborita')
    expect(links[0]).toHaveAttribute('href', '/games/snake')
  })
})
