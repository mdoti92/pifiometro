import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StandingsList } from './StandingsList'

describe('StandingsList', () => {
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

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveStyle({ color: 'var(--ink)' })
    expect(rows[1]).toHaveStyle({ color: 'var(--hearth)' })
  })

  it('no resalta ninguna fila cuando no se pasa el usuario actual', () => {
    render(
      <StandingsList
        standings={[{ userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 1 }]}
      />,
    )

    expect(screen.getByRole('listitem')).toHaveStyle({ color: 'var(--ink)' })
  })
})
