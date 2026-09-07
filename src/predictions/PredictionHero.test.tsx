import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { MatchPredictionStatus } from './myPredictionsService'
import { PredictionHero } from './PredictionHero'

const MATCH: MatchPredictionStatus = {
  matchId: 'match-1',
  homeTeam: 'Nacional',
  awayTeam: 'Peñarol',
  homeTeamSlug: 'nacional',
  awayTeamSlug: 'penarol',
  kickoffAt: '2026-03-01T22:00:00Z',
  status: 'pendiente',
  homeGoals: null,
  awayGoals: null,
}

describe('PredictionHero', () => {
  it('muestra el logo de cada equipo del partido destacado', () => {
    render(
      <MemoryRouter>
        <PredictionHero match={MATCH} groupId="group-1" now={new Date('2026-03-01T20:00:00Z')} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('img', { name: 'Nacional' })).toHaveAttribute(
      'src',
      '/team-logos/nacional.svg',
    )
    expect(screen.getByRole('img', { name: 'Peñarol' })).toHaveAttribute(
      'src',
      '/team-logos/penarol.svg',
    )
  })
})
