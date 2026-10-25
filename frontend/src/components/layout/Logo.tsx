import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({
  to = '/',
  tone = 'dark',
  className,
}: {
  to?: string
  tone?: 'dark' | 'light'
  className?: string
}) {
  return (
    <Link to={to} className={cn('group inline-flex flex-col leading-none', className)}>
      <span
        className={cn(
          'font-script text-[1.9rem] tracking-wide transition group-hover:opacity-80',
          tone === 'light' ? 'text-cream' : 'text-ink',
        )}
      >
        Ever After
      </span>
      <span
        className={cn(
          'mt-0.5 pl-1 text-[0.52rem] font-semibold uppercase tracking-[0.44em]',
          tone === 'light' ? 'text-cream/45' : 'text-ink/40',
        )}
      >
        Studio
      </span>
    </Link>
  )
}
