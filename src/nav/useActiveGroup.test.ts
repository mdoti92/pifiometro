import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { MyGroup } from '../groups/groupsService'
import { useActiveGroup } from './useActiveGroup'

const GROUP_1: MyGroup = { id: 'group-1', name: 'Los pibes' }
const GROUP_2: MyGroup = { id: 'group-2', name: 'La barra' }

beforeEach(() => {
  localStorage.clear()
})

describe('useActiveGroup', () => {
  it('devuelve null cuando el usuario no tiene grupos', () => {
    const { result } = renderHook(() => useActiveGroup([]))

    expect(result.current.activeGroupId).toBeNull()
  })

  it('elige el primer grupo por defecto cuando no hay ninguno guardado', () => {
    const { result } = renderHook(() => useActiveGroup([GROUP_1, GROUP_2]))

    expect(result.current.activeGroupId).toBe('group-1')
  })

  it('restaura el grupo activo guardado en localStorage si todavia es valido', () => {
    localStorage.setItem('pifiometro.activeGroupId', 'group-2')

    const { result } = renderHook(() => useActiveGroup([GROUP_1, GROUP_2]))

    expect(result.current.activeGroupId).toBe('group-2')
  })

  it('cae al primer grupo si el guardado ya no pertenece a la lista actual', () => {
    localStorage.setItem('pifiometro.activeGroupId', 'group-viejo')

    const { result } = renderHook(() => useActiveGroup([GROUP_1, GROUP_2]))

    expect(result.current.activeGroupId).toBe('group-1')
  })

  it('persiste el cambio de grupo activo en localStorage', () => {
    const { result } = renderHook(() => useActiveGroup([GROUP_1, GROUP_2]))

    act(() => {
      result.current.setActiveGroupId('group-2')
    })

    expect(result.current.activeGroupId).toBe('group-2')
    expect(localStorage.getItem('pifiometro.activeGroupId')).toBe('group-2')
  })
})
