import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MatchdaySummaryPage } from './MatchdaySummaryPage'
import * as standingsService from './standingsService'

vi.mock('./standingsService', async () => {
  const actual =
    await vi.importActual<typeof import('./standingsService')>('./standingsService')
  return { ...actual, getMatchdaySummaries: vi.fn() }
})

const mockedGetMatchdaySummaries = vi.mocked(standingsService.getMatchdaySummaries)

beforeEach(() => {
  vi.clearAllMocks()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/groups/group-1/tournaments/tournament-1/matchday-summary']}>
      <Routes>
        <Route
          path="/groups/:groupId/tournaments/:tournamentId/matchday-summary"
          element={<MatchdaySummaryPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MatchdaySummaryPage', () => {
  it('muestra la mejor fecha y las fechas ganadas de cada miembro', async () => {
    mockedGetMatchdaySummaries.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', bestMatchday: { matchday: 2, points: 4 }, matchdaysWon: 3 },
    ])
    renderPage()

    expect(mockedGetMatchdaySummaries).toHaveBeenCalledWith('group-1', 'tournament-1')
    const row = await screen.findByText(/Doti/)
    expect(row).toHaveTextContent('Mejor fecha: Fecha 2 (4 pts)')
    expect(row).toHaveTextContent('Fechas ganadas: 3')
  })

  it('muestra guiones cuando el usuario todavia no tiene fechas jugadas', async () => {
    mockedGetMatchdaySummaries.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', bestMatchday: null, matchdaysWon: 0 },
    ])
    renderPage()

    const row = await screen.findByText(/Doti/)
    expect(row).toHaveTextContent('Mejor fecha: —')
    expect(row).toHaveTextContent('Fechas ganadas: 0')
  })
})
