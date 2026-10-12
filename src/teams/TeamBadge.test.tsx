import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TeamBadge } from './TeamBadge'

describe('TeamBadge', () => {
  it('intenta primero el logo en svg', () => {
    render(<TeamBadge name="Danubio" slug="danubio" />)

    expect(screen.getByRole('img', { name: 'Danubio' })).toHaveAttribute(
      'src',
      '/team-logos/danubio.svg',
    )
  })

  it('cae al png cuando el svg no existe', () => {
    render(<TeamBadge name="Danubio" slug="danubio" />)

    fireEvent.error(screen.getByRole('img', { name: 'Danubio' }))

    expect(screen.getByRole('img', { name: 'Danubio' })).toHaveAttribute(
      'src',
      '/team-logos/danubio.png',
    )
  })

  it('muestra el badge de iniciales cuando ni el svg ni el png existen', () => {
    render(<TeamBadge name="Danubio" slug="danubio" />)

    const img = screen.getByRole('img', { name: 'Danubio' })
    fireEvent.error(img)
    fireEvent.error(screen.getByRole('img', { name: 'Danubio' }))

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('DA')).toBeInTheDocument()
  })
})
