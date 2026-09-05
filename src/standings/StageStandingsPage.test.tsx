import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import { StageStandingsPage } from './StageStandingsPage'
import * as standingsService from './standingsService'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./standingsService', async () => {
  const actual =
    await vi.importActual<typeof import('./standingsService')>('./standingsService')
  return { ...actual, getGroupStageStandings: vi.fn() }
})

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedGetStageStandings = vi.mocked(standingsService.getGroupStageStandings)

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { access_token: 't' } as never,
    user: { id: 'user-1' } as never,
    loading: false,
  })
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/groups/group-1/stages/stage-1/standings']}>
      <Routes>
        <Route path="/groups/:groupId/stages/:stageId/standings" element={<StageStandingsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StageStandingsPage', () => {
  it('muestra la tabla de puntos limitada a la etapa seleccionada', async () => {
    mockedGetStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 3, rank: 1 },
    ])
    renderPage()

    expect(mockedGetStageStandings).toHaveBeenCalledWith('group-1', 'stage-1')
    expect(await screen.findByText(/Doti/)).toBeInTheDocument()
  })

  it('muestra la tabla sin error cuando la etapa no tiene partidos jugados', async () => {
    mockedGetStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 0, rank: 1 },
    ])
    renderPage()

    expect(await screen.findByText(/0 pts/)).toBeInTheDocument()
  })
})
