import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JoinGroupForm } from './JoinGroupForm'
import * as groupsService from './groupsService'

vi.mock('./groupsService', async () => {
  const actual = await vi.importActual<typeof import('./groupsService')>('./groupsService')
  return { ...actual, joinGroup: vi.fn() }
})

const mockedJoinGroup = vi.mocked(groupsService.joinGroup)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('JoinGroupForm', () => {
  it('se une al grupo con el codigo ingresado y muestra confirmacion', async () => {
    mockedJoinGroup.mockResolvedValue('group-1')
    const user = userEvent.setup()
    render(<JoinGroupForm />)

    await user.type(screen.getByLabelText('Código de invitación'), 'AB12CD')
    await user.click(screen.getByRole('button', { name: 'Unirme' }))

    expect(mockedJoinGroup).toHaveBeenCalledWith('AB12CD')
    expect(await screen.findByText('Te uniste al grupo')).toBeInTheDocument()
  })

  it('muestra un error cuando el codigo es invalido, sin mostrar confirmacion', async () => {
    mockedJoinGroup.mockRejectedValue(new Error('Codigo de invitacion invalido'))
    const user = userEvent.setup()
    render(<JoinGroupForm />)

    await user.type(screen.getByLabelText('Código de invitación'), 'NOEXISTE')
    await user.click(screen.getByRole('button', { name: 'Unirme' }))

    expect(await screen.findByText('Codigo de invitacion invalido')).toBeInTheDocument()
    expect(screen.queryByText('Te uniste al grupo')).not.toBeInTheDocument()
  })
})
