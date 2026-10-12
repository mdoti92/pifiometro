import type { MyGroup } from '../groups/groupsService'

interface GroupSelectorProps {
  groups: MyGroup[]
  activeGroupId: string
  onChange: (groupId: string) => void
}

export function GroupSelector({ groups, activeGroupId, onChange }: GroupSelectorProps) {
  if (groups.length <= 1) return null

  return (
    <label>
      Grupo:{' '}
      <select
        aria-label="Grupo activo"
        value={activeGroupId}
        onChange={(event) => onChange(event.target.value)}
      >
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </label>
  )
}
