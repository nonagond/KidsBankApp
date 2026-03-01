import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around h-16 z-40 safe-bottom">
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-8 py-2 rounded-xl transition-colors ${
              isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`
          }
        >
          <span className="text-2xl">{icon}</span>
          <span className="text-xs font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
