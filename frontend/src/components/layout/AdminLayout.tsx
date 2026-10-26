import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarHeart,
  ChevronRight,
  ExternalLink,
  Images,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  LogOut,
  Mail,
  Menu,
  Palette,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const navigation = [
  {
    label: 'Studio',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/invitations', label: 'Invitations', icon: CalendarHeart },
      { to: '/admin/rsvps', label: 'RSVPs', icon: Mail },
      { to: '/admin/media', label: 'Media library', icon: Images },
    ],
  },
  {
    label: 'Design',
    items: [
      { to: '/admin/designs', label: 'All designs', icon: LayoutGrid },
      { to: '/admin/themes', label: 'Themes', icon: Palette },
      { to: '/admin/templates', label: 'Templates', icon: LayoutTemplate },
      { to: '/admin/animations', label: 'Animations', icon: Sparkles },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/admin/settings', label: 'Settings', icon: Settings }],
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-7 pb-7 pt-7">
        <Logo to="/admin/dashboard" tone="light" />
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-4 pb-6">
        {navigation.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-cream/30">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-[0.78rem] font-medium tracking-wide transition',
                        isActive
                          ? 'border-gold bg-white/[0.07] text-cream'
                          : 'border-transparent text-cream/55 hover:bg-white/[0.04] hover:text-cream/85',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn('h-4 w-4 shrink-0 transition', isActive ? 'text-gold' : 'text-cream/35 group-hover:text-cream/60')}
                        />
                        <span className="flex-1">{item.label}</span>
                        {isActive ? <ChevronRight className="h-3.5 w-3.5 text-gold/70" /> : null}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-display text-sm text-gold">
            {(user?.name?.[0] ?? 'A').toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-cream/85">{user?.name ?? 'Studio admin'}</p>
            <p className="truncate text-[0.6rem] text-cream/35">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[0.68rem] text-cream/40 transition hover:bg-white/[0.05] hover:text-cream/75"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] bg-wine-deep shadow-2xl lg:block">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:18px_18px]" />
        <div className="relative h-full">
          <SidebarContent />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[17rem] bg-wine-deep shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-full p-2 text-cream/50 transition hover:bg-white/10 hover:text-cream"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[17rem]">
        <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="btn-icon lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink/35">
                  Ever After Studio
                </p>
                <p className="truncate font-display text-lg leading-tight text-ink">Invitation atelier</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                target="_blank"
                className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink/45 transition hover:bg-ink/[0.05] hover:text-ink sm:inline-flex"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Public site
              </Link>
              <span className="hidden h-6 w-px bg-ink/10 sm:block" />
              <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-cream/70 py-1 pl-1 pr-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wine font-display text-xs text-cream">
                  {(user?.name?.[0] ?? 'A').toUpperCase()}
                </span>
                <span className="hidden text-[0.65rem] font-medium text-ink/60 sm:block">{user?.name?.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[90rem] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
          <Outlet />
        </main>

        <footer className="mx-auto flex w-full max-w-[90rem] flex-col items-center justify-between gap-2 border-t border-ink/10 px-4 py-6 text-[0.6rem] uppercase tracking-[0.18em] text-ink/30 sm:flex-row sm:px-7 lg:px-10">
          <span>Ever After Studio · Invitation atelier</span>
          <span>Made for the moments that matter</span>
        </footer>
      </div>
    </div>
  )
}
