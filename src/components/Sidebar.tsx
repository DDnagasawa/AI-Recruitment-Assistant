import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  FileSearch,
  LayoutDashboard,
  LogOut,
  Settings,
  X,
} from 'lucide-react'
import clsx from 'clsx'

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
  onNavigate?: () => void
}

const navItems: Array<{ to: string; label: string; icon: typeof LayoutDashboard }> = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/screening', label: 'AI Screening', icon: FileSearch },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function SidebarContent({ onNavigate }: Pick<SidebarProps, 'onNavigate'>) {
  return (
    <aside className="flex h-full w-full flex-col bg-slate-900 text-slate-200">
      <div className="border-b border-slate-800 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">HireFlow</p>
        <p className="mt-2 text-lg font-semibold text-white">AI Hiring Assistant</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} onClick={onNavigate} end={item.to === '/dashboard'}>
              {({ isActive }) => (
                <span
                  className={clsx(
                    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition',
                    isActive
                      ? 'bg-blue-600/20 text-blue-100'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
                  )}
                >
                  <span
                    className={clsx(
                      'absolute left-0 top-2 h-6 w-1 rounded-r-full',
                      isActive ? 'bg-blue-400' : 'bg-transparent',
                    )}
                  />
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl bg-slate-800/70 p-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/30 text-sm font-semibold text-blue-100">
              DD
            </div>
            <div>
              <p className="text-sm font-medium text-white">Dana Doe</p>
              <p className="text-xs text-slate-400">CEO</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <button className="flex items-center justify-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-slate-300 transition hover:bg-slate-700">
              <LogOut className="h-3.5 w-3.5" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
  onNavigate,
}: SidebarProps) {
  return (
    <>
      <div className="hidden w-72 shrink-0 lg:block">
        <SidebarContent onNavigate={onNavigate} />
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden"
            onClick={onCloseMobile}
          >
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="relative h-full w-72"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={onCloseMobile}
                className="absolute top-4 right-4 z-10 rounded-md bg-slate-800 p-1 text-slate-200"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNavigate={onNavigate} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
