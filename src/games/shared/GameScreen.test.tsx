import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../../auth/AuthContext'
import { SNAKE_GAME } from '../catalog'
import { GameScreen } from './GameScreen'

vi.mock('../../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../auth/AuthContext')>('../../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

beforeEach(() => {
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({ session: null, user: { id: 'u1' } as never, loading: false })
})

function renderScreen(status: 'idle' | 'running') {
  return render(
    <GameScreen game={SNAKE_GAME} palette="nokia" status={status} hud={[]} onPress={vi.fn()} hint="">
      <div />
    </GameScreen>,
  )
}

describe('GameScreen', () => {
  it('en la pantalla de inicio muestra el objetivo y cómo se juega', () => {
    renderScreen('idle')

    const start = screen.getByRole('status')
    expect(start).toHaveTextContent('Tocá para jugar')
    expect(start).toHaveTextContent(SNAKE_GAME.goal)
    expect(start).toHaveTextContent(SNAKE_GAME.howToPlay)
  })

  it('con la partida en curso la explicación no tapa el tablero', () => {
    renderScreen('running')

    expect(screen.queryByText(SNAKE_GAME.goal)).not.toBeInTheDocument()
  })
})
