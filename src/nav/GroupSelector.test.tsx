import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GroupSelector } from './GroupSelector'

const GROUP_1 = { id: 'group-1', name: 'Los pibes' }
const GROUP_2 = { id: 'group-2', name: 'La barra' }

describe('GroupSelector', () => {
  it('no renderiza nada cuando el usuario pertenece a un solo grupo', () => {
    const { container } = render(
      <GroupSelector groups={[GROUP_1]} activeGroupId="group-1" onChange={vi.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('no renderiza nada cuando el usuario no tiene grupos', () => {
    const { container } = render(
      <GroupSelector groups={[]} activeGroupId="" onChange={vi.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('lista los grupos y notifica el cambio al elegir otro', () => {
    const onChange = vi.fn()
    render(<GroupSelector groups={[GROUP_1, GROUP_2]} activeGroupId="group-1" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Grupo activo'), { target: { value: 'group-2' } })

    expect(onChange).toHaveBeenCalledWith('group-2')
  })
})
