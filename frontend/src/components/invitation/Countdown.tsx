import { useEffect, useState } from 'react'
import { computeCountdown } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function Countdown({
  target,
  completedMessage,
  compact = false,
  className,
}: {
  target?: string | null
  completedMessage?: string | null
  compact?: boolean
  className?: string
}) {
  const [value, setValue] = useState(() => computeCountdown(target))

  useEffect(() => {
    setValue(computeCountdown(target))
    if (!target) return
    const timer = window.setInterval(() => setValue(computeCountdown(target)), 1000)
    return () => window.clearInterval(timer)
  }, [target])

  if (value.expired) {
    return (
      <p className={cn('text-sm leading-relaxed', className)} style={{ color: 'var(--w-muted)' }}>
        {completedMessage ?? 'Today is the day. We cannot wait to celebrate with you.'}
      </p>
    )
  }

  const units = [
    { label: 'Days', value: value.days },
    { label: 'Hours', value: value.hours },
    { label: 'Minutes', value: value.minutes },
    { label: 'Seconds', value: value.seconds },
  ]

  if (compact) {
    return (
      <div className={cn('flex items-start gap-4 sm:gap-6', className)} aria-label="Countdown to the wedding">
        {units.map((unit) => (
          <div key={unit.label} className="text-center">
            <span className="block font-display text-2xl leading-none text-[#fffaf2] sm:text-3xl">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="mt-1 block text-[0.5rem] uppercase tracking-[0.24em] text-white/55">{unit.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3" aria-label="Countdown to the wedding">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="relative overflow-hidden rounded-[var(--w-card-radius)] border border-[var(--w-card-border)] bg-[var(--w-card-bg)] px-2 py-5 text-center sm:py-6"
          >
            <span className="block font-display text-4xl leading-none text-[var(--w-primary)] sm:text-5xl">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="mt-2 block text-[0.55rem] uppercase tracking-[0.24em] text-[var(--w-muted)]">
              {unit.label}
            </span>
            <span className="absolute inset-x-4 bottom-0 h-px bg-[var(--w-accent)]/30" />
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[0.62rem] uppercase tracking-[0.2em] text-[var(--w-muted)]">
        {new Date(target ?? '').toLocaleDateString('en-US', { timeZone: 'UTC' }) ===
        new Date(target ?? '').toLocaleDateString('en-US')
          ? 'Counting every moment'
          : 'Until we celebrate'}
      </p>
    </div>
  )
}
