import { NavLink, useParams } from 'react-router-dom'
import { LayoutDashboard, LogOut, Settings, ChevronRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const { projectId } = useParams()

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-surface-200 bg-surface-50">
      <div className="flex items-center gap-2.5 border-b border-surface-200 px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
          <span className="text-xs font-bold text-white">L</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-surface-900">Luminaria</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
            }`
          }
        >
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>

        {projectId && (
          <div className="mt-3">
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-widest text-surface-400">
              Project
            </p>
            <NavLink
              to={`/p/${projectId}`}
              end
              className={({ isActive }) =>
                `mt-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                }`
              }
            >
              <ChevronRight size={14} />
              Overview
            </NavLink>
          </div>
        )}
      </nav>

      <div className="border-t border-surface-200 p-2">
        {user && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {(user.display_name ?? user.email)[0].toUpperCase()}
            </div>
            <span className="flex-1 truncate text-xs font-medium text-surface-700">
              {user.display_name ?? user.email}
            </span>
          </div>
        )}
        <div className="mt-0.5 flex gap-0.5">
          <NavLink
            to="/settings"
            className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-colors"
          >
            <Settings size={15} />
            Settings
          </NavLink>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
