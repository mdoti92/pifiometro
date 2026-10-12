import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as standingsService from '../standings/standingsService'
import { PredictionHero } from './PredictionHero'

vi.mock('../standings/standingsService', async () => {
  const actual =
    await vi.importActual<typeof import('../standings/standingsService')>('../standings/standingsService')
  return { ...actual, getGroupStageStandings: vi.fn() }
})

const mockedGetGroupStageStandings = vi.mocked(standingsService.getGroupStageStandings)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PredictionHero', () => {
  it('muestra el total de puntos y la posicion del usuario en la etapa', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-2', displayName: 'Aldo', totalPoints: 9, rank: 1 },
      { userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 2 },
    ])

    render(<PredictionHero groupId="group-1" stageId="stage-1" userId="user-1" />)

    expect(mockedGetGroupStageStandings).toHaveBeenCalledWith('group-1', 'stage-1')
    expect(await screen.findByText('6 pts')).toBeInTheDocument()
    expect(screen.getByText('2° lugar')).toBeInTheDocument()
  })

  it('no muestra nada cuando el usuario no aparece en la tabla', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([])

    const { container } = render(<PredictionHero groupId="group-1" stageId="stage-1" userId="user-1" />)

    await waitFor(() => expect(mockedGetGroupStageStandings).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
