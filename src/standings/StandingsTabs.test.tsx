import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StandingsTabs } from './StandingsTabs'

const STAGES = [
  { id: 'stage-1', tournamentId: 'tournament-1', name: 'Apertura', orderIndex: 0 },
  { id: 'stage-2', tournamentId: 'tournament-1', name: 'Clausura', orderIndex: 1 },
]

describe('StandingsTabs', () => {
  it('muestra un tab General y uno por cada etapa del torneo', () => {
    render(
      <MemoryRouter>
        <StandingsTabs groupId="group-1" tournamentId="tournament-1" stages={STAGES} activeStageId={null} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'General' })).toHaveAttribute(
      'href',
      '/groups/group-1/tournaments/tournament-1/standings',
    )
    expect(screen.getByRole('link', { name: 'Apertura' })).toHaveAttribute(
      'href',
      '/groups/group-1/stages/stage-1/standings',
    )
    expect(screen.getByRole('link', { name: 'Clausura' })).toHaveAttribute(
      'href',
      '/groups/group-1/stages/stage-2/standings',
    )
  })

  it('marca General como activo cuando activeStageId es null', () => {
    render(
      <MemoryRouter>
        <StandingsTabs groupId="group-1" tournamentId="tournament-1" stages={STAGES} activeStageId={null} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'General' })).toHaveClass('active')
    expect(screen.getByRole('link', { name: 'Apertura' })).not.toHaveClass('active')
  })

  it('marca la etapa correspondiente como activa', () => {
    render(
      <MemoryRouter>
        <StandingsTabs
          groupId="group-1"
          tournamentId="tournament-1"
          stages={STAGES}
          activeStageId="stage-2"
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Clausura' })).toHaveClass('active')
    expect(screen.getByRole('link', { name: 'General' })).not.toHaveClass('active')
    expect(screen.getByRole('link', { name: 'Apertura' })).not.toHaveClass('active')
  })
})
