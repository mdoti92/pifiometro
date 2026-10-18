import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DisplayNameForm } from './DisplayNameForm'
import * as displayNameService from './displayNameService'

vi.mock('./displayNameService', () => ({
  fetchMyDisplayName: vi.fn(),
  saveMyDisplayName: vi.fn(),
}))

const mockedFetch = vi.mocked(displayNameService.fetchMyDisplayName)
const mockedSave = vi.mocked(displayNameService.saveMyDisplayName)

beforeEach(() => {
  vi.clearAllMocks()
  mockedFetch.mockResolvedValue('Doti')
  mockedSave.mockResolvedValue(undefined)
})

describe('DisplayNameForm', () => {
  it('muestra el nombre actual en el campo', async () => {
    render(<DisplayNameForm userId="u1" />)

    expect(await screen.findByDisplayValue('Doti')).toBeInTheDocument()
    expect(mockedFetch).toHaveBeenCalledWith('u1')
  })

  it('guarda el nuevo nombre y avisa que se guardo', async () => {
    const user = userEvent.setup()
    render(<DisplayNameForm userId="u1" />)

    const input = await screen.findByLabelText('Nombre o alias')
    await user.clear(input)
    await user.type(input, 'El Doti')
    await user.click(screen.getByRole('button', { name: 'Guardar nombre' }))

    expect(mockedSave).toHaveBeenCalledWith('u1', 'El Doti')
    expect(await screen.findByText('Nombre guardado')).toBeInTheDocument()
  })

  it('muestra el error si no se pudo guardar', async () => {
    mockedSave.mockRejectedValue(new Error('El nombre no puede estar vacío'))
    const user = userEvent.setup()
    render(<DisplayNameForm userId="u1" />)

    await user.clear(await screen.findByLabelText('Nombre o alias'))
    await user.click(screen.getByRole('button', { name: 'Guardar nombre' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El nombre no puede estar vacío')
  })
})
