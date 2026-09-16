import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StandingsList } from './StandingsList'

describe('StandingsList', () => {
  it('se renderiza como una tabla, no como una lista con bullets', () => {
    render(
      <StandingsList
        standings={[{ userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 1 }]}
      />,
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('muestra columnas de posicion, jugador y puntos', () => {
    render(
      <StandingsList
        standings={[
          { userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 1 },
          { userId: 'user-2', displayName: 'Aldo', totalPoints: 4, rank: 2 },
        ]}
      />,
    )

    const rows = screen.getAllByRole('row')
    expect(rows[0]).toHaveTextContent('Posición')
    expect(rows[0]).toHaveTextContent('Jugador')
    expect(rows[0]).toHaveTextContent('Puntos')
    expect(rows[1]).toHaveTextContent('1°')
    expect(rows[1]).toHaveTextContent('Doti')
    expect(rows[1]).toHaveTextContent('6 pts')
    expect(rows[2]).toHaveTextContent('2°')
    expect(rows[2]).toHaveTextContent('Aldo')
    expect(rows[2]).toHaveTextContent('4 pts')
  })

  it('resalta la fila del usuario actual con el color hearth', () => {
    render(
      <StandingsList
        standings={[
          { userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 1 },
          { userId: 'user-2', displayName: 'Aldo', totalPoints: 4, rank: 2 },
        ]}
        currentUserId="user-2"
      />,
    )

    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveStyle({ color: 'var(--ink)' })
    expect(rows[2]).toHaveStyle({ color: 'var(--hearth)' })
  })

  it('no resalta ninguna fila cuando no se pasa el usuario actual', () => {
    render(
      <StandingsList
        standings={[{ userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 1 }]}
      />,
    )

    expect(screen.getAllByRole('row')[1]).toHaveStyle({ color: 'var(--ink)' })
  })

  it('usa el userId como nombre cuando no hay display name', () => {
    render(
      <StandingsList
        standings={[{ userId: 'user-1', displayName: null, totalPoints: 0, rank: 1 }]}
      />,
    )

    expect(screen.getByText('user-1')).toBeInTheDocument()
  })
})
