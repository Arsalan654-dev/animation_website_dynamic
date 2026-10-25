import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Heart } from 'lucide-react'
import { EnvelopeIntro } from '@/components/invitation/EnvelopeIntro'
import { Ornament } from '@/components/invitation/Ornament'
import { Reveal } from '@/components/invitation/Reveal'
import { SectionRenderer } from '@/components/invitation/SectionRenderer'
import { themeCssVars } from '@/lib/theme'
import { cn, googleCalendarUrl } from '@/lib/utils'
import type { PublicInvitation } from '@/types'

const NAV_LABELS: Record<string, string> = {
  story: 'Our Story',
  events: 'Celebrations',
  gallery: 'Gallery',
  venue: 'Venue',
  travel: 'Travel',
  wedding_party: 'The Party',
  gifts: 'Gifts',
  countdown: 'Countdown',
}

export function InvitationSite({
  invitation,
  preview = false,
  startOpened = false,
}: {
  invitation: PublicInvitation
  preview?: boolean
  startOpened?: boolean
}) {
  const storageKey = `everafter:opened:${invitation.slug}`
  const [searchParams] = useSearchParams()
  const guestCode = searchParams.get('guest')?.trim() ?? ''
  const [opened, setOpened] = useState(() => {
    if (startOpened || guestCode || !invitation.envelope.enabled) return true
    try {
      return sessionStorage.getItem(storageKey) === '1'
    } catch {
      return false
    }
  })

  const sections = useMemo(
    () => [...invitation.sections].filter((section) => section.is_visible).sort((a, b) => a.sort_order - b.sort_order),
    [invitation.sections],
  )

  const navLinks = useMemo(
    () =>
      sections
        .filter((section) => NAV_LABELS[section.type])
        .slice(0, 6)
        .map((section) => ({ id: section.id, label: NAV_LABELS[section.type], anchor: `#section-${section.id}` })),
    [sections],
  )

  const rsvpSection = sections.find((section) => section.type === 'rsvp')
  const hasHero = sections.some((section) => section.type === 'hero')

  useEffect(() => {
    if (opened) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [opened])

  useEffect(() => {
    if (!guestCode || !rsvpSection) return
    const timer = window.setTimeout(() => {
      document.getElementById(`section-${rsvpSection.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 550)
    return () => window.clearTimeout(timer)
  }, [guestCode, rsvpSection])

  const handleOpen = () => {
    setOpened(true)
    try {
      sessionStorage.setItem(storageKey, '1')
    } catch {
      // Storage may be unavailable; the invitation still opens for this visit.
    }
  }

  const tokens = invitation.theme.tokens

  return (
    <div className="invitation-root" style={themeCssVars(tokens)}>
      <div className="inv-texture" />

      <AnimatePresence>
        {!opened && invitation.envelope.enabled ? (
          <EnvelopeIntro key="envelope" invitation={invitation} onOpen={handleOpen} />
        ) : null}
      </AnimatePresence>

      <div className={cn('relative z-[1]', !opened && 'max-h-[100svh] overflow-hidden')} aria-hidden={!opened}>
        <header
          className="fixed inset-x-0 top-0 z-40 border-b backdrop-blur-md"
          style={{
            borderColor: 'var(--w-line)',
            background: 'color-mix(in srgb, var(--w-page-bg) 88%, transparent)',
          }}
        >
          <div className="inv-container flex h-16 items-center justify-between gap-4">
            <a href="#top" className="flex min-w-0 items-center gap-3" aria-label="Back to top">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--w-accent)]/50 font-display text-[0.62rem] text-[var(--w-primary)]">
                {invitation.monogram || 'E&A'}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate font-display text-lg leading-none text-[var(--w-primary)]">
                  {invitation.couple.partner_one} &amp; {invitation.couple.partner_two}
                </span>
                <span className="mt-0.5 block text-[0.48rem] uppercase tracking-[0.28em] text-[var(--w-muted)]">
                  {invitation.event?.short_date}
                </span>
              </span>
            </a>

            <nav className="hidden items-center gap-5 lg:flex" aria-label="Invitation sections">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.anchor}
                  className="text-[0.58rem] uppercase tracking-[0.18em] text-[var(--w-muted)] transition hover:text-[var(--w-primary)]"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              {rsvpSection && invitation.rsvp.open ? (
                <a href={`#section-${rsvpSection.id}`} className="inv-btn inv-btn--fill !px-4 !py-2 sm:!px-5">
                  <Heart className="h-3 w-3" />
                  RSVP
                </a>
              ) : (
                <a href="#top" className="text-[0.55rem] uppercase tracking-[0.2em] text-[var(--w-muted)]">
                  {invitation.monogram}
                </a>
              )}
              {preview ? (
                <span className="rounded-full border border-[var(--w-accent)]/40 px-2 py-1 text-[0.5rem] uppercase tracking-[0.18em] text-[var(--w-accent)]">
                  Preview
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <div id="top" />
        <main>
          {!hasHero ? (
            <section className="relative flex min-h-[72svh] items-center justify-center px-5 py-28 text-center">
              <div className="absolute inset-0" style={{ background: 'var(--w-surface-alt)' }} />
              <div className="relative">
                <p className="inv-eyebrow">{invitation.couple.title ?? 'Together with their families'}</p>
                <h1 className="inv-display inv-hero-name mt-4 text-[var(--w-primary)]">
                  {invitation.couple.partner_one} &amp; {invitation.couple.partner_two}
                </h1>
                <Ornament type={tokens.ornaments.divider} className="mt-6" width={120} />
                <p className="inv-body mt-5 text-[0.68rem] uppercase tracking-[0.24em] text-[var(--w-muted)]">
                  {invitation.event?.formatted} · {invitation.venue.name}
                </p>
              </div>
            </section>
          ) : null}

          {sections.map((section) => (
            <Reveal
              key={section.id}
              animation={section.animation}
              animationsEnabled={invitation.animations_enabled}
            >
              <SectionRenderer section={section} invitation={invitation} />
            </Reveal>
          ))}

          {sections.length === 0 ? (
            <section className="inv-section">
              <div className="inv-container py-16 text-center">
                <Ornament type={tokens.ornaments.divider} width={100} />
                <h2 className="inv-display mt-6 text-4xl">Our celebration is being written</h2>
                <p className="inv-body mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--w-muted)]">
                  {invitation.couple.message ?? 'Please check back soon for the full invitation.'}
                </p>
              </div>
            </section>
          ) : null}
        </main>

        <footer className="relative border-t" style={{ borderColor: 'var(--w-line)', background: 'var(--w-surface-alt)' }}>
          <div className="inv-container py-14 text-center sm:py-16">
            <Ornament type={tokens.ornaments.divider} width={110} />
            <p className="inv-script mt-6 text-[clamp(2.6rem,6vw,4rem)] leading-none text-[var(--w-primary)]">
              {invitation.couple.partner_one} &amp; {invitation.couple.partner_two}
            </p>
            <p className="inv-body mt-4 text-[0.62rem] uppercase tracking-[0.26em] text-[var(--w-muted)]">
              {invitation.event?.formatted}
              {invitation.venue.name ? ` · ${invitation.venue.name}` : ''}
            </p>

            {invitation.couple.hashtag ? (
              <p className="mt-4 text-[0.66rem] uppercase tracking-[0.22em] text-[var(--w-accent)]">
                {invitation.couple.hashtag}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {invitation.event ? (
                <a
                  href={googleCalendarUrl({
                    title: `${invitation.couple.partner_one} & ${invitation.couple.partner_two} — Wedding`,
                    startIso: invitation.event.iso,
                    details: invitation.couple.message ?? undefined,
                    location: [invitation.venue.name, invitation.venue.address].filter(Boolean).join(', '),
                    timezone: invitation.event.timezone,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="inv-btn inv-btn--outline"
                >
                  Add to calendar <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              ) : null}
              {rsvpSection && invitation.rsvp.open ? (
                <a href={`#section-${rsvpSection.id}`} className="inv-btn inv-btn--fill">
                  Reply to the invitation
                </a>
              ) : null}
            </div>

            <div className="mt-12 border-t pt-6" style={{ borderColor: 'var(--w-line)' }}>
              <p className="text-[0.52rem] uppercase tracking-[0.26em] text-[var(--w-muted)]">
                Made with love · Ever After Studio
              </p>
              {invitation.couple.quote ? (
                <p className="inv-body mx-auto mt-3 max-w-md font-display text-sm italic text-[var(--w-muted)]">
                  “{invitation.couple.quote}”
                </p>
              ) : null}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
