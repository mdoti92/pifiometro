import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '../auth/AuthContext'
import { GroupsHome } from './GroupsHome'
import * as groupsService from './groupsService'

vi.mock('../auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../auth/AuthContext')>('../auth/AuthContext')
  return { ...actual, useAuth: vi.fn() }
})

vi.mock('./groupsService', async () => {
  const actual = await vi.importActual<typeof import('./groupsService')>('./groupsService')
  return { ...actual, listMyGroups: vi.fn() }
})

vi.mock('../notifications/usePushSubscriptionPrompt', () => ({
  usePushSubscriptionPrompt: vi.fn(),
}))

const mockedUseAuth = vi.mocked(AuthContextModule.useAuth)
const mockedListMyGroups = vi.mocked(groupsService.listMyGroups)

beforeEach(() => {
  vi.clearAllMocks()
  mockedUseAuth.mockReturnValue({
    session: { access_token: 't' } as never,
    user: { id: 'user-1' } as never,
    loading: false,
  })
})

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<GroupsHome />} />
        <Route path="/groups/:groupId/tournaments" element={<p>Torneos del grupo</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GroupsHome', () => {
  it('redirige a la pantalla principal del grupo cuando el usuario ya pertenece a uno', async () => {
    mockedListMyGroups.mockResolvedValue([{ id: 'group-1', name: 'LBDH' }])
    renderHome()

    expect(await screen.findByText('Torneos del grupo')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Crear grupo' })).not.toBeInTheDocument()
  })

  it('muestra crear/unirse a un grupo cuando el usuario no pertenece a ninguno', async () => {
    mockedListMyGroups.mockResolvedValue([])
    renderHome()

    expect(await screen.findByRole('heading', { name: 'Crear grupo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Unirme a un grupo' })).toBeInTheDocument()
  })
})
