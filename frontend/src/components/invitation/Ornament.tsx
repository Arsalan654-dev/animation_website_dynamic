import { cn } from '@/lib/utils'

type OrnamentType = 'botanical' | 'line' | 'diamond' | 'none'

export function Ornament({
  type = 'botanical',
  className,
  width = 120,
}: {
  type?: OrnamentType | string
  className?: string
  width?: number
}) {
  if (type === 'none') return null

  if (type === 'line') {
    return (
      <div className={cn('flex items-center justify-center gap-3', className)} aria-hidden>
        <span className="h-px w-16 bg-[var(--w-line)] sm:w-24" />
        <span className="h-1 w-1 rotate-45 bg-[var(--w-accent)]" />
        <span className="h-px w-16 bg-[var(--w-line)] sm:w-24" />
      </div>
    )
  }

  if (type === 'diamond') {
    return (
      <div className={cn('flex items-center justify-center gap-3', className)} aria-hidden>
        <span className="h-px w-12 bg-[var(--w-line)] sm:w-20" />
        <span className="block h-2.5 w-2.5 rotate-45 border border-[var(--w-accent)]" />
        <span className="h-px w-12 bg-[var(--w-line)] sm:w-20" />
      </div>
    )
  }

  return (
    <svg
      width={width}
      height={width * 0.32}
      viewBox="0 0 120 38"
      fill="none"
      className={cn('mx-auto text-[var(--w-accent)]', className)}
      aria-hidden
    >
      <path d="M1 19h31" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" opacity="0.55" />
      <path d="M88 19h31" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" opacity="0.55" />
      <path
        d="M48 26c-5.8 0-10.4-3.1-10.4-7 0-3.8 4.2-6.7 9.5-7.3 2.4-.3 5.2.1 7.4 1.2 3.3 1.6 5.3 4.2 5.3 6.8"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path
        d="M72 26c5.8 0 10.4-3.1 10.4-7 0-3.8-4.2-6.7-9.5-7.3-2.4-.3-5.2.1-7.4 1.2-3.3 1.6-5.3 4.2-5.3 6.8"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path d="M60 11.5v21" stroke="currentColor" strokeWidth="0.7" opacity="0.65" />
      <circle cx="60" cy="9" r="2.4" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="60" cy="9" r="0.9" fill="currentColor" />
      <path d="M45 12c3.2-.2 6 1.4 7.4 4.2M75 12c-3.2-.2-6 1.4-7.4 4.2" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" opacity="0.75" />
      <path d="M38 19h-8M90 19h8" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  )
}

export function CornerBranch({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      className={cn('h-24 w-24 text-[var(--w-accent)] sm:h-32 sm:w-32', flip && 'scale-x-[-1]', className)}
      aria-hidden
    >
      <path d="M4 4c36 2 74 24 92 62 10 21 13 44 10 70" stroke="currentColor" strokeWidth="0.9" opacity="0.55" />
      <path d="M30 12c4 12 13 20 26 23-14 1-25 8-33 20 2-17 3-30 7-43Z" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
      <path d="M54 30c8 9 19 13 32 11-12 6-20 16-23 29-4-16-7-28-9-40Z" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
      <path d="M76 59c10 5 21 5 33-1-9 9-14 21-14 34-8-13-14-24-19-33Z" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <circle cx="28" cy="37" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="70" cy="50" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="95" cy="84" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}
