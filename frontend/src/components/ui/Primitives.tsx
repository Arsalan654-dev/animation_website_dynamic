import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type BadgeTone = 'neutral' | 'green' | 'amber' | 'red' | 'gold' | 'wine'

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'border-ink/10 bg-paper text-ink/60',
  green: 'border-[#4f7a58]/20 bg-[#4f7a58]/10 text-[#3f6b4b]',
  amber: 'border-[#9a7634]/20 bg-[#9a7634]/10 text-[#836426]',
  red: 'border-[#9b3434]/20 bg-[#9b3434]/10 text-[#8c2d2d]',
  gold: 'border-gold/30 bg-gold/15 text-[#836426]',
  wine: 'border-wine/20 bg-wine/10 text-wine',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em]',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-gold', className)} aria-label="Loading" />
}

export function PageLoader({ label = 'Loading the studio' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Spinner className="h-6 w-6" />
      <p className="text-[0.65rem] uppercase tracking-[0.24em] text-ink/40">{label}</p>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-cream/40 px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {description ? <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink/50">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="admin-eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="admin-title">{title}</h1>
        {description ? <p className="admin-muted mt-2 max-w-2xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5',
        accent ? 'border-wine/20 bg-wine text-cream' : 'border-ink/10 bg-cream/80',
      )}
    >
      {accent ? (
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border border-gold/20" />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            'text-[0.62rem] font-semibold uppercase tracking-[0.2em]',
            accent ? 'text-cream/60' : 'text-ink/45',
          )}
        >
          {label}
        </p>
        {icon ? <span className={accent ? 'text-gold' : 'text-gold'}>{icon}</span> : null}
      </div>
      <p className={cn('mt-3 font-display text-4xl leading-none', accent ? 'text-cream' : 'text-ink')}>{value}</p>
      {hint ? (
        <p className={cn('mt-2 text-xs leading-relaxed', accent ? 'text-cream/55' : 'text-ink/40')}>{hint}</p>
      ) : null}
    </div>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<{ value: T; label: string; count?: number }>
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto rounded-full border border-ink/10 bg-cream/60 p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] transition',
            value === tab.value ? 'bg-ink text-cream shadow' : 'text-ink/50 hover:bg-ink/[0.05] hover:text-ink',
          )}
        >
          {tab.label}
          {typeof tab.count === 'number' ? (
            <span className={cn('text-[0.6rem]', value === tab.value ? 'text-cream/60' : 'text-ink/35')}>
              {tab.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="admin-eyebrow mb-1.5">{eyebrow}</p> : null}
        <h2 className="font-display text-2xl leading-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-relaxed text-ink/45">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
