import { NavLink } from 'react-router-dom'
import type { TabHrefs } from './resolveTabHrefs'

const TABS: { key: keyof TabHrefs | 'perfil'; label: string }[] = [
  { key: 'pronosticos', label: 'Pronósticos' },
  { key: 'fixture', label: 'Fixture' },
  { key: 'tabla', label: 'Tabla' },
  { key: 'grupo', label: 'Grupo' },
  { key: 'perfil', label: 'Perfil' },
]

export function BottomNav({ hrefs }: { hrefs: TabHrefs }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {TABS.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.key === 'perfil' ? '/profile' : hrefs[tab.key]}
          className={({ isActive }) => (isActive ? 'bottom-nav-tab active' : 'bottom-nav-tab')}
          end={tab.key === 'perfil'}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
