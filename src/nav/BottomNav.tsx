import { NavLink } from 'react-router-dom'
import type { TabHrefs } from './resolveTabHrefs'

type FixedTab = 'juegos' | 'perfil'

const TABS: { key: keyof TabHrefs | FixedTab; label: string }[] = [
  { key: 'pronosticos', label: 'Pronósticos' },
  { key: 'fixture', label: 'Fixture' },
  { key: 'tabla', label: 'Tabla' },
  { key: 'juegos', label: 'Juegos' },
  { key: 'perfil', label: 'Perfil' },
]

const FIXED_TAB_PATHS: Record<FixedTab, string> = {
  juegos: '/games',
  perfil: '/profile',
}

function isFixedTab(key: keyof TabHrefs | FixedTab): key is FixedTab {
  return key in FIXED_TAB_PATHS
}

export function BottomNav({ hrefs }: { hrefs: TabHrefs }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {TABS.map((tab) => (
        <NavLink
          key={tab.key}
          to={isFixedTab(tab.key) ? FIXED_TAB_PATHS[tab.key] : hrefs[tab.key]}
          className={({ isActive }) => (isActive ? 'bottom-nav-tab active' : 'bottom-nav-tab')}
          end={tab.key === 'perfil'}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
