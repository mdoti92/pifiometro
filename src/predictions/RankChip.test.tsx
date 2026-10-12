import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as standingsService from '../standings/standingsService'
import { RankChip } from './RankChip'

vi.mock('../standings/standingsService', async () => {
  const actual =
    await vi.importActual<typeof import('../standings/standingsService')>('../standings/standingsService')
  return { ...actual, getGroupStageStandings: vi.fn() }
})

const mockedGetGroupStageStandings = vi.mocked(standingsService.getGroupStageStandings)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('RankChip', () => {
  it('muestra el puntaje y la posicion abreviada del usuario', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-2', displayName: 'Aldo', totalPoints: 9, rank: 1 },
      { userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 2 },
    ])

    render(<RankChip groupId="group-1" stageId="stage-1" userId="user-1" />)

    expect(mockedGetGroupStageStandings).toHaveBeenCalledWith('group-1', 'stage-1')
    expect(await screen.findByText('6 pts - 2do')).toBeInTheDocument()
  })

  it('no muestra nada cuando el usuario no aparece en la tabla', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([])

    const { container } = render(<RankChip groupId="group-1" stageId="stage-1" userId="user-1" />)

    await waitFor(() => expect(mockedGetGroupStageStandings).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('pinta el chip de verde (moss) cuando el usuario va primero', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 10, rank: 1 },
    ])

    render(<RankChip groupId="group-1" stageId="stage-1" userId="user-1" />)

    const chip = await screen.findByText('10 pts - 1ro')
    expect(chip).toHaveStyle({ backgroundColor: 'var(--moss)' })
  })

  it('pinta el chip de amarillo (gold) cuando el usuario va segundo', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 6, rank: 2 },
    ])

    render(<RankChip groupId="group-1" stageId="stage-1" userId="user-1" />)

    const chip = await screen.findByText('6 pts - 2do')
    expect(chip).toHaveStyle({ backgroundColor: 'var(--gold)' })
  })

  it('pinta el chip de rojo (rust) cuando el usuario va tercero', async () => {
    mockedGetGroupStageStandings.mockResolvedValue([
      { userId: 'user-1', displayName: 'Doti', totalPoints: 2, rank: 3 },
    ])

    render(<RankChip groupId="group-1" stageId="stage-1" userId="user-1" />)

    const chip = await screen.findByText('2 pts - 3ro')
    expect(chip).toHaveStyle({ backgroundColor: 'var(--rust)' })
  })
})
