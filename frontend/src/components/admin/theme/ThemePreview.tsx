import { themeCssVars } from '@/lib/theme'
import { cn } from '@/lib/utils'
import type { ThemeTokens } from '@/types'

interface ThemePreviewProps {
  tokens: ThemeTokens
  name?: string
  partnerOne?: string
  partnerTwo?: string
  dateLabel?: string
  className?: string
  compact?: boolean
}

export function ThemePreview({
  tokens,
  name,
  partnerOne = 'Amara',
  partnerTwo = 'Zayd',
  dateLabel = 'Saturday, the twelfth of June',
  className,
  compact = false,
}: ThemePreviewProps) {
  return (
    <div
      className={cn('overflow-hidden rounded-xl border border-ink/10', className)}
      style={themeCssVars(tokens)}
    >
      <div
        className={cn('relative flex flex-col items-center justify-center px-6 text-center', compact ? 'py-10' : 'py-14')}
        style={{
          background: `linear-gradient(155deg, ${tokens.colors.surface} 0%, ${tokens.colors.surfaceAlt} 100%)`,
          color: tokens.colors.text,
        }}
      >
        <span
          className="pointer-events-none absolute inset-3 border"
          style={{ borderColor: tokens.colors.line }}
          aria-hidden
        />
        {name ? (
          <p
            className="relative text-[0.5rem] font-semibold uppercase"
            style={{ color: tokens.colors.accent, letterSpacing: `${tokens.buttons.letterSpacing}em` }}
          >
            {name}
          </p>
        ) : null}
        <p
          className="relative mt-3 text-[0.55rem] uppercase tracking-[0.28em]"
          style={{ color: tokens.colors.muted }}
        >
          Together with their families
        </p>
        <p
          className={cn('relative mt-3 leading-[0.95]', compact ? 'text-3xl' : 'text-5xl')}
          style={{ fontFamily: `var(--w-heading-font)`, color: tokens.colors.primary, fontWeight: tokens.typography.headingWeight }}
        >
          {partnerOne} <span style={{ fontFamily: 'var(--w-script-font)', color: tokens.colors.accent }}>&amp;</span>{' '}
          {partnerTwo}
        </p>
        <div className="relative mt-3 h-px w-16" style={{ background: tokens.colors.line }} />
        <p
          className="relative mt-3 text-[0.55rem] uppercase tracking-[0.2em]"
          style={{ color: tokens.colors.muted, fontFamily: 'var(--w-body-font)' }}
        >
          {dateLabel}
        </p>
        <span
          className="relative mt-5 inline-flex items-center px-4 py-2 text-[0.52rem] font-semibold uppercase"
          style={{
            borderRadius: `${tokens.buttons.radius}px`,
            border: `1px solid ${tokens.colors.primary}`,
            color: tokens.colors.primary,
            letterSpacing: `${tokens.buttons.letterSpacing}em`,
          }}
        >
          Open invitation
        </span>
      </div>
    </div>
  )
}
