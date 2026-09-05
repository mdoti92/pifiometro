import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StageStandingsPage } from './StageStandingsPage'
import * as standingsService from './standingsService'

vi.mock('./standingsService', async () => {
  const actual =
    await vi.importActual<typeof import('./standingsService')>('./standingsService')
  return { ...actual, getGroupStageStandings: vi.fn() }
})

const mockedGetStageStandings = vi.mocked(standingsService.getGroupStageStandings)

beforeEach(() => {
  vi.clearAllMocks()
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
