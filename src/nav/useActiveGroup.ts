import { useState } from 'react'
import type { MyGroup } from '../groups/groupsService'

const STORAGE_KEY = 'pifiometro.activeGroupId'

export interface UseActiveGroupResult {
  activeGroupId: string | null
  setActiveGroupId: (groupId: string) => void
}

export function useActiveGroup(groups: MyGroup[]): UseActiveGroupResult {
  const [storedGroupId, setStoredGroupId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  )

  const activeGroupId =
    groups.length === 0 ? null : groups.some((group) => group.id === storedGroupId) ? storedGroupId : groups[0].id

  function setActiveGroupId(groupId: string): void {
    localStorage.setItem(STORAGE_KEY, groupId)
    setStoredGroupId(groupId)
  }

  return { activeGroupId, setActiveGroupId }
}
