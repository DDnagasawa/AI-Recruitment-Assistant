import { Bell, Menu } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle: string
  onOpenMobileMenu: () => void
}

export function Header({ title, subtitle, onOpenMobileMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="rounded-md border border-slate-200 p-2 text-slate-600 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div>
            <p className="text-lg font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              DD
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-medium text-slate-800">Nexa Labs</p>
              <p className="text-[11px] text-slate-500">Founder Account</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
