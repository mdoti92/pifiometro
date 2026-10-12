import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MatchCard } from './MatchCard'

describe('MatchCard', () => {
  it('muestra el escudo y el nombre de cada equipo', () => {
    render(
      <MatchCard
        homeTeam="Nacional"
        homeTeamSlug="nacional"
        awayTeam="Peñarol"
        awayTeamSlug="penarol"
        center="2-1"
      />,
    )

    expect(screen.getByRole('img', { name: 'Nacional' })).toHaveAttribute(
      'src',
      '/team-logos/nacional.svg',
    )
    expect(screen.getByRole('img', { name: 'Peñarol' })).toHaveAttribute(
      'src',
      '/team-logos/penarol.svg',
    )
    expect(screen.getByText('Nacional')).toBeInTheDocument()
    expect(screen.getByText('Peñarol')).toBeInTheDocument()
  })

  it('muestra el contenido central (marcador, fecha o estado del pronostico)', () => {
    render(
      <MatchCard
        homeTeam="Nacional"
        homeTeamSlug="nacional"
        awayTeam="Peñarol"
        awayTeamSlug="penarol"
        center="2-1"
      />,
    )

    expect(screen.getByText('2-1')).toBeInTheDocument()
  })

  it('muestra el footer cuando se lo pasa', () => {
    render(
      <MatchCard
        homeTeam="Nacional"
        homeTeamSlug="nacional"
        awayTeam="Peñarol"
        awayTeamSlug="penarol"
        center="2-1"
        footer={<button type="button">Editar</button>}
      />,
    )

    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
  })
})
