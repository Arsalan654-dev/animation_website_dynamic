import { useState } from 'react'
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  ExternalLink,
  Heart,
  Mail,
  MapPin,
  Phone,
  Play,
  Sparkles,
} from 'lucide-react'
import { Countdown } from '@/components/invitation/Countdown'
import { Lightbox } from '@/components/invitation/Lightbox'
import { Ornament, CornerBranch } from '@/components/invitation/Ornament'
import { RsvpForm } from '@/components/invitation/RsvpForm'
import {
  assetUrl,
  extractIframeSource,
  googleCalendarUrl,
  safeExternalUrl,
  splitParagraphs,
  vimeoEmbedUrl,
  youtubeEmbedUrl,
} from '@/lib/utils'
import type { GalleryImage, LinkEntry, PublicEvent, PublicInvitation, PublicSection } from '@/types'

interface SectionProps {
  section: PublicSection
  invitation: PublicInvitation
}

function SectionIntro({
  eyebrow,
  heading,
  intro,
  align = 'center',
  light = false,
}: {
  eyebrow?: string
  heading?: string
  intro?: string
  align?: 'left' | 'center'
  light?: boolean
}) {
  if (!eyebrow && !heading && !intro) return null
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow ? <p className="inv-eyebrow">{eyebrow}</p> : null}
      {heading ? <h2 className={`inv-display mt-3 text-[clamp(2.2rem,5vw,3.6rem)] ${light ? 'text-[#fffaf2]' : ''}`}>{heading}</h2> : null}
      <Ornament type={invitationThemeDivider()} className="mt-5" width={96} />
      {intro ? (
        <p className={`inv-body mx-auto mt-5 max-w-xl text-[0.95rem] leading-relaxed ${light ? 'text-white/70' : 'text-[var(--w-muted)]'} ${align === 'left' ? 'ml-0' : ''}`}>
          {intro}
        </p>
      ) : null}
    </div>
  )
}

function invitationThemeDivider(): string {
  return 'botanical'
}

function HeroSection({ section, invitation }: SectionProps) {
  const content = section.content
  const [lightbox, setLightbox] = useState<number | null>(null)
  const background = assetUrl(content.background?.url ?? invitation.cover_image)
  const overlay = typeof content.overlay_opacity === 'number' ? content.overlay_opacity : 0.4
  const rsvpSection = invitation.sections.find((item) => item.type === 'rsvp')
  const heading = content.heading || `${invitation.couple.partner_one} & ${invitation.couple.partner_two}`
  const ctaLabel = content.primary_cta?.label ?? 'RSVP'
  const ctaTarget = content.primary_cta?.href || (rsvpSection ? `#section-${rsvpSection.id}` : '#rsvp')

  return (
    <section
      id={`section-${section.id}`}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 py-24 text-center text-[#fffaf2]"
    >
      {background ? (
        <img src={background} alt={content.background?.alt ?? ''} className="absolute inset-0 h-full w-full object-cover inv-photo" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 100% at 50% 0%, var(--w-secondary) 0%, var(--w-primary) 55%, var(--w-text) 100%)',
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(18,12,10,${Math.min(overlay + 0.14, 0.86)}) 0%, rgba(18,12,10,${overlay}) 42%, rgba(18,12,10,${Math.min(overlay + 0.32, 0.92)}) 100%)`,
        }}
      />
      <div className="inv-texture opacity-10 mix-blend-soft-light" />
      <CornerBranch className="absolute left-0 top-0 hidden text-[#e7d3ae]/45 opacity-70 sm:block" />
      <CornerBranch className="absolute right-0 top-0 hidden -scale-x-100 text-[#e7d3ae]/45 opacity-70 sm:block" />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center">
        <p className="text-[0.58rem] uppercase tracking-[0.45em] text-white/60">
          {content.eyebrow ?? invitation.couple.title ?? 'Together with their families'}
        </p>

        <h1 className="inv-display inv-hero-name mt-5 max-w-4xl text-balance text-[#fffaf2] drop-shadow-[0_3px_24px_rgba(0,0,0,0.35)]">
          {heading}
        </h1>

        <Ornament type={invitation.theme.tokens.ornaments.divider} className="mt-6 opacity-90" width={130} />

        <p className="inv-body mt-6 max-w-xl text-[0.78rem] uppercase tracking-[0.26em] text-white/70">
          {content.subheading ?? invitation.couple.subtitle ?? 'invite you to celebrate their wedding'}
        </p>

        <div className="mt-7 flex flex-col items-center gap-2 text-[0.7rem] uppercase tracking-[0.22em] text-white/85">
          <span>{content.date_label ?? invitation.event?.formatted}</span>
          <span className="h-3 w-px bg-white/30" />
          <span>{invitation.venue.name}</span>
        </div>

        {content.show_countdown && invitation.event ? (
          <div className="mt-8">
            <Countdown target={invitation.event.iso} compact />
          </div>
        ) : null}

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href={ctaTarget}
            className="inv-btn inv-btn--fill border-white/0 bg-[#f7efe1] !text-[#2b1d18] hover:!bg-white"
          >
            {ctaLabel}
          </a>
          {background ? (
            <button
              type="button"
              onClick={() => setLightbox(0)}
              className="inv-btn inv-btn--outline border-white/45 !text-white hover:!bg-white/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              View cover
            </button>
          ) : null}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-white/40">
          <span className="text-[0.5rem] uppercase tracking-[0.4em]">Scroll</span>
          <span className="h-10 w-px bg-gradient-to-b from-white/45 to-transparent" />
        </div>
      </div>

      {background ? (
        <Lightbox
          images={[{ url: background, alt: content.background?.alt ?? 'Cover photograph' }]}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={() => undefined}
        />
      ) : null}
    </section>
  )
}

function CountdownSection({ section, invitation }: SectionProps) {
  return (
    <section id={`section-${section.id}`} className="inv-section" style={{ background: 'var(--w-surface-alt)' }}>
      <div className="inv-container mx-auto max-w-3xl text-center">
        <SectionIntro eyebrow={section.content.eyebrow} heading={section.content.heading} intro={section.content.intro} />
        <div className="mt-9">
          <Countdown
            target={invitation.event?.iso}
            completedMessage={section.content.completed_message}
          />
        </div>
      </div>
    </section>
  )
}

function StorySection({ section, invitation }: SectionProps) {
  const content = section.content
  const image = assetUrl(content.image?.url)
  const body = content.body ?? invitation.couple.story_body
  const heading = content.heading ?? invitation.couple.story_heading
  const timeline = Array.isArray(content.timeline) ? content.timeline : []
  const imageRight = content.image_position === 'right'

  return (
    <section id={`section-${section.id}`} className="inv-section">
      <div className="inv-container grid items-center gap-10 md:grid-cols-12 md:gap-14">
        <div className={`relative md:col-span-5 ${imageRight ? 'md:order-2' : ''}`}>
          {image ? (
            <div className="relative">
              <div className="absolute -inset-3 border border-[var(--w-accent)]/25" aria-hidden />
              <img
                src={image}
                alt={content.image?.alt ?? 'The couple'}
                className="relative aspect-[4/5] w-full object-cover inv-photo inv-shadow-soft"
                loading="lazy"
              />
              <p className="inv-script absolute -bottom-5 -right-2 bg-[var(--w-page-bg)] px-4 py-1 text-3xl text-[var(--w-primary)]">
                {invitation.couple.partner_one?.[0]}
                <span className="mx-1 text-xl">&amp;</span>
                {invitation.couple.partner_two?.[0]}
              </p>
            </div>
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center border border-[var(--w-line)]">
              <span className="inv-script text-6xl text-[var(--w-primary)]">{invitation.monogram}</span>
            </div>
          )}
        </div>

        <div className="md:col-span-7">
          <p className="inv-eyebrow">{content.eyebrow ?? 'Our beginning'}</p>
          <h2 className="inv-display mt-3 text-[clamp(2.2rem,5vw,3.6rem)]">{heading ?? 'Our Story'}</h2>
          <Ornament type={invitation.theme.tokens.ornaments.divider} className="mt-5 justify-start" width={90} />
          {content.intro ? (
            <p className="inv-body mt-5 text-[0.98rem] leading-relaxed text-[var(--w-muted)]">{content.intro}</p>
          ) : null}
          <div className="inv-prose inv-body mt-5 text-[0.94rem] leading-relaxed text-[var(--w-text)]/80">
            {splitParagraphs(body).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {timeline.length ? (
            <div className="mt-8 space-y-5 border-l border-[var(--w-line)] pl-5">
              {timeline.map((entry, index) => (
                <div key={`${entry.title}-${index}`} className="relative">
                  <span className="absolute -left-[1.42rem] top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--w-accent)]" />
                  <p className="text-[0.58rem] uppercase tracking-[0.24em] text-[var(--w-accent)]">{entry.date}</p>
                  <p className="mt-0.5 font-display text-xl leading-tight">{entry.title}</p>
                  {entry.text ? <p className="mt-1 text-sm leading-relaxed text-[var(--w-muted)]">{entry.text}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          {content.signature ? (
            <p className="inv-script mt-7 text-4xl text-[var(--w-primary)]">{content.signature}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function QuoteSection({ section, invitation }: SectionProps) {
  const content = section.content
  return (
    <section id={`section-${section.id}`} className="inv-section" style={{ background: 'var(--w-surface-alt)' }}>
      <div className="inv-container relative mx-auto max-w-3xl text-center">
        <span
          className="inv-display pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 text-[10rem] leading-none text-[var(--w-accent)]/20"
          aria-hidden
        >
          &ldquo;
        </span>
        <Ornament type={invitation.theme.tokens.ornaments.divider} className="mb-7 opacity-70" width={82} />
        <blockquote className="inv-display relative text-[clamp(1.9rem,4.5vw,3.2rem)] italic leading-[1.25] text-[var(--w-primary)]">
          {content.quote ?? invitation.couple.quote}
        </blockquote>
        {content.attribution ? (
          <p className="inv-eyebrow mt-6 before:mx-3 before:inline-block before:h-px before:w-6 before:align-middle before:bg-[var(--w-line)] after:mx-3 after:inline-block after:h-px after:w-6 after:align-middle after:bg-[var(--w-line)]">
            {content.attribution}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function MapPanel({ embed, mapUrl, name, address }: { embed?: string | null; mapUrl?: string | null; name?: string | null; address?: string | null }) {
  const iframe = extractIframeSource(embed)
  if (iframe) {
    return (
      <div className="overflow-hidden rounded-[var(--w-card-radius)] border border-[var(--w-card-border)]">
        <iframe
          src={iframe}
          title={`Map to ${name ?? 'the venue'}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-64 w-full sm:h-80"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <div className="relative flex h-64 flex-col items-center justify-center overflow-hidden border border-[var(--w-card-border)] bg-[var(--w-surface-alt)] p-6 text-center sm:h-80">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(var(--w-line) 1px, transparent 1px), linear-gradient(90deg, var(--w-line) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
        }}
        aria-hidden
      />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[var(--w-accent)]/40 bg-[var(--w-page-bg)] text-[var(--w-primary)]">
        <MapPin className="h-5 w-5" />
      </span>
      <p className="relative mt-3 font-display text-2xl leading-tight">{name}</p>
      {address ? <p className="relative mt-1 max-w-xs text-xs leading-relaxed text-[var(--w-muted)]">{address}</p> : null}
      {mapUrl ? (
        <a href={mapUrl} target="_blank" rel="noreferrer" className="inv-btn inv-btn--text relative mt-4">
          Open in maps <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      ) : null}
    </div>
  )
}

function EventRow({ event, index, invitation }: { event: PublicEvent; index: number; invitation: PublicInvitation }) {
  const image = assetUrl(event.image?.url)
  const map = safeExternalUrl(event.map_url)
  const date = event.date
  const calendar =
    event.date?.iso
      ? googleCalendarUrl({
          title: `${event.title} — ${invitation.couple.partner_one} & ${invitation.couple.partner_two}`,
          startIso: event.date.iso,
          details: event.description ?? undefined,
          location: [event.venue_name, event.venue_address].filter(Boolean).join(', '),
          timezone: event.timezone,
        })
      : null

  return (
    <article className="inv-card group overflow-hidden">
      <div className={`grid md:grid-cols-12 ${index % 2 === 1 ? 'md:[direction:rtl]' : ''}`}>
        {image ? (
          <div className="md:col-span-5 md:[direction:ltr]">
            <img
              src={image}
              alt={event.image?.alt ?? event.title}
              loading="lazy"
              className="h-56 w-full object-cover inv-photo transition duration-700 group-hover:scale-[1.015] md:h-full md:min-h-[19rem]"
            />
          </div>
        ) : null}
        <div className={`flex flex-col justify-center p-6 sm:p-8 md:[direction:ltr] ${image ? 'md:col-span-7' : 'md:col-span-12'}`}>
          <div className="flex items-start gap-5">
            {date ? (
              <div className="shrink-0 border-r border-[var(--w-line)] pr-5 text-center">
                <p className="font-display text-4xl leading-none text-[var(--w-primary)]">{date.day}</p>
                <p className="mt-1 text-[0.55rem] uppercase tracking-[0.22em] text-[var(--w-muted)]">{date.month}</p>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-[var(--w-muted)]">{date.year}</p>
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="inv-eyebrow">{index === 0 ? 'The celebrations begin' : 'Join us for'}</p>
              <h3 className="inv-display mt-1 text-3xl sm:text-4xl">{event.title}</h3>
              {date ? (
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.62rem] uppercase tracking-[0.16em] text-[var(--w-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-[var(--w-accent)]" />
                    {date.formatted}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[var(--w-accent)]" />
                    {date.time_formatted}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          {event.description ? (
            <p className="inv-body mt-4 text-sm leading-relaxed text-[var(--w-muted)]">{event.description}</p>
          ) : null}

          <div className="mt-4 space-y-1.5 text-sm">
            {event.venue_name ? (
              <p className="flex items-start gap-2 text-[var(--w-text)]/80">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--w-accent)]" />
                <span>
                  {event.venue_name}
                  {event.venue_address ? <span className="block text-xs text-[var(--w-muted)]">{event.venue_address}</span> : null}
                </span>
              </p>
            ) : null}
            {event.dress_code ? (
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[var(--w-muted)]">
                Dress code · {event.dress_code}
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-4">
            {map ? (
              <a href={map} target="_blank" rel="noreferrer" className="inv-btn inv-btn--text">
                Directions <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ) : null}
            {calendar ? (
              <a href={calendar} target="_blank" rel="noreferrer" className="inv-btn inv-btn--text">
                Add to calendar <CalendarDays className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

function EventsSection({ section, invitation }: SectionProps) {
  const events: PublicEvent[] =
    invitation.events.length > 0
      ? invitation.events
      : invitation.event
        ? [
            {
              id: 0,
              title: `${invitation.couple.partner_one} & ${invitation.couple.partner_two}`,
              description: invitation.couple.message ?? null,
              date: invitation.event,
              timezone: invitation.event.timezone,
              venue_name: invitation.venue.name,
              venue_address: invitation.venue.address,
              map_url: invitation.venue.map_url,
              dress_code: null,
              rsvp_enabled: true,
              image: null,
            },
          ]
        : []

  return (
    <section id={`section-${section.id}`} className="inv-section">
      <div className="inv-container">
        <SectionIntro
          eyebrow={section.content.eyebrow ?? 'The celebrations'}
          heading={section.content.heading}
          intro={section.content.intro}
        />
        <div className="mt-10 space-y-6">
          {events.map((event, index) => (
            <EventRow key={event.id || `${event.title}-${index}`} event={event} index={index} invitation={invitation} />
          ))}
        </div>
        {section.content.note ? (
          <p className="inv-body mx-auto mt-7 max-w-xl text-center text-xs leading-relaxed text-[var(--w-muted)]">
            {section.content.note}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function GallerySection({ section, invitation }: SectionProps) {
  const [index, setIndex] = useState<number | null>(null)
  const images = (Array.isArray(section.content.images) ? section.content.images : []).filter(
    (image): image is GalleryImage => Boolean(assetUrl(image.url)),
  )
  const layout = section.content.layout ?? invitation.theme.tokens.layout.gallery

  if (images.length === 0) return null

  return (
    <section id={`section-${section.id}`} className="inv-section" style={{ background: 'var(--w-surface-alt)' }}>
      <div className="inv-container">
        <SectionIntro
          eyebrow={section.content.eyebrow ?? 'A few favourite moments'}
          heading={section.content.heading}
          intro={section.content.intro}
        />
        {layout === 'grid' ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {images.map((image, imageIndex) => (
              <button
                key={`${image.url}-${imageIndex}`}
                type="button"
                onClick={() => setIndex(imageIndex)}
                className="group relative aspect-square overflow-hidden rounded-[var(--w-card-radius)] bg-[var(--w-surface)]"
                aria-label={`Open photograph ${imageIndex + 1}`}
              >
                <img
                  src={assetUrl(image.url) ?? ''}
                  alt={image.alt ?? image.caption ?? 'Wedding photograph'}
                  loading="lazy"
                  className="h-full w-full object-cover inv-photo transition duration-700 group-hover:scale-[1.04]"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="inv-masonry mt-10">
            {images.map((image, imageIndex) => (
              <button
                key={`${image.url}-${imageIndex}`}
                type="button"
                onClick={() => setIndex(imageIndex)}
                className="group relative block w-full overflow-hidden rounded-[var(--w-card-radius)] bg-[var(--w-surface)]"
                aria-label={`Open photograph ${imageIndex + 1}`}
              >
                <img
                  src={assetUrl(image.url) ?? ''}
                  alt={image.alt ?? image.caption ?? 'Wedding photograph'}
                  loading="lazy"
                  className="w-full object-cover inv-photo transition duration-700 group-hover:scale-[1.03]"
                />
                {image.caption ? (
                  <span className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/70 to-transparent px-3 pb-2 pt-8 text-left text-[0.62rem] uppercase tracking-[0.16em] text-white/80 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                    {image.caption}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
        <p className="mt-6 text-center text-[0.58rem] uppercase tracking-[0.22em] text-[var(--w-muted)]">
          Select a photograph to view the gallery
        </p>
      </div>
      <Lightbox images={images} index={index} onClose={() => setIndex(null)} onNavigate={setIndex} />
    </section>
  )
}

function VenueSection({ section, invitation }: SectionProps) {
  const content = section.content
  const name = content.name ?? invitation.venue.name
  const address = content.address ?? invitation.venue.address
  const mapUrl = safeExternalUrl(content.map_url ?? invitation.venue.map_url)
  const embed = content.map_embed ?? invitation.venue.map_embed
  const image = assetUrl(content.image?.url)

  return (
    <section id={`section-${section.id}`} className="inv-section">
      <div className="inv-container">
        <SectionIntro eyebrow={content.eyebrow ?? 'Where we will celebrate'} heading={content.heading} intro={content.intro} />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {image ? (
              <img
                src={image}
                alt={content.image?.alt ?? name ?? 'The venue'}
                loading="lazy"
                className="aspect-[16/10] w-full rounded-[var(--w-card-radius)] object-cover inv-photo inv-shadow-soft"
              />
            ) : null}
            <div className="inv-card p-6 sm:p-8">
              <p className="inv-eyebrow">The place</p>
              <h3 className="inv-display mt-2 text-3xl">{name}</h3>
              {address ? <p className="inv-body mt-2 text-sm leading-relaxed text-[var(--w-muted)]">{address}</p> : null}
              {mapUrl ? (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="inv-btn inv-btn--fill mt-5">
                  <MapPin className="h-3.5 w-3.5" /> Get directions
                </a>
              ) : null}
              {content.notes ? (
                <p className="mt-5 border-t border-[var(--w-card-border)] pt-4 text-xs leading-relaxed text-[var(--w-muted)]">
                  {content.notes}
                </p>
              ) : null}
            </div>
          </div>
          <MapPanel embed={embed} mapUrl={mapUrl} name={name} address={address} />
        </div>
      </div>
    </section>
  )
}

function RsvpSection({ section, invitation }: SectionProps) {
  const content = section.content
  return (
    <section
      id={`section-${section.id}`}
      className="inv-section"
      style={{ background: 'var(--w-surface-alt)' }}
    >
      <div className="inv-container">
        <SectionIntro
          eyebrow={content.eyebrow ?? 'Your presence means the world'}
          heading={content.heading ?? 'Will You Join Us?'}
          intro={content.intro}
        />
        {content.note ? (
          <p className="inv-body mx-auto mt-4 max-w-lg text-center text-xs leading-relaxed text-[var(--w-muted)]">{content.note}</p>
        ) : null}
        <div className="mt-9">
          <RsvpForm invitation={invitation} content={content} />
        </div>
      </div>
    </section>
  )
}

function TextSection({ section }: SectionProps) {
  const content = section.content
  const align = content.align ?? 'center'
  return (
    <section id={`section-${section.id}`} className="inv-section">
      <div className={`inv-container ${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}`}>
        <SectionIntro eyebrow={content.eyebrow} heading={content.heading} intro={content.intro} align={align} />
        <div className={`inv-prose inv-body mt-5 text-[0.95rem] leading-relaxed text-[var(--w-text)]/80 ${align === 'center' ? 'mx-auto max-w-2xl' : ''}`}>
          {splitParagraphs(content.body).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        {content.cta?.label && content.cta.href ? (
          <a href={content.cta.href} className={`inv-btn inv-btn--outline mt-6 ${align === 'center' ? 'mx-auto' : ''}`}>
            {content.cta.label}
          </a>
        ) : null}
      </div>
    </section>
  )
}

function ImageTextSection({ section, invitation }: SectionProps) {
  const content = section.content
  const image = assetUrl(content.image?.url)
  const imageRight = content.image_position === 'right'

  return (
    <section id={`section-${section.id}`} className="inv-section">
      <div className="inv-container grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className={imageRight ? 'md:order-2' : ''}>
          {image ? (
            <img
              src={image}
              alt={content.image?.alt ?? content.heading ?? 'Photograph'}
              loading="lazy"
              className="w-full rounded-[var(--w-card-radius)] object-cover inv-photo inv-shadow-soft"
              style={{ aspectRatio: 'var(--w-image-aspect)' }}
            />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center border border-[var(--w-line)]">
              <Ornament type={invitation.theme.tokens.ornaments.divider} width={120} />
            </div>
          )}
        </div>
        <div className={imageRight ? 'md:order-1' : ''}>
          <SectionIntro
            eyebrow={content.eyebrow}
            heading={content.heading}
            intro={content.intro}
            align="left"
          />
          <div className="inv-prose inv-body mt-4 text-[0.94rem] leading-relaxed text-[var(--w-text)]/80">
            {splitParagraphs(content.body).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {content.cta?.label && content.cta.href ? (
            <a href={content.cta.href} className="inv-btn inv-btn--outline mt-5">
              {content.cta.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function WeddingPartySection({ section }: SectionProps) {
  const content = section.content
  const members = Array.isArray(content.members) ? content.members : []

  return (
    <section id={`section-${section.id}`} className="inv-section" style={{ background: 'var(--w-surface-alt)' }}>
      <div className="inv-container">
        <SectionIntro eyebrow={content.eyebrow ?? 'Standing beside us'} heading={content.heading} intro={content.intro} />
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, index) => {
            const image = assetUrl(member.url)
            return (
              <div key={`${member.name}-${index}`} className="text-center">
                {image ? (
                  <img
                    src={image}
                    alt={member.alt ?? member.name}
                    loading="lazy"
                    className="mx-auto aspect-[4/5] w-full max-w-xs rounded-[var(--w-card-radius)] object-cover inv-photo inv-shadow-soft"
                  />
                ) : (
                  <div className="mx-auto flex aspect-[4/5] w-full max-w-xs items-center justify-center rounded-[var(--w-card-radius)] border border-[var(--w-line)]">
                    <span className="inv-script text-5xl text-[var(--w-primary)]/60">{member.name?.[0]}</span>
                  </div>
                )}
                <h3 className="inv-display mt-4 text-2xl">{member.name}</h3>
                {member.role ? <p className="inv-eyebrow mt-1">{member.role}</p> : null}
                {member.bio ? <p className="inv-body mx-auto mt-2 max-w-xs text-xs leading-relaxed text-[var(--w-muted)]">{member.bio}</p> : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function GiftsSection({ section }: SectionProps) {
  const content = section.content
  const links = Array.isArray(content.links) ? content.links : []
  return (
    <section id={`section-${section.id}`} className="inv-section">
      <div className="inv-container mx-auto max-w-3xl">
        <SectionIntro eyebrow={content.eyebrow ?? 'With gratitude'} heading={content.heading} intro={content.intro} />
        <div className="inv-card mt-8 p-7 text-center sm:p-10">
          <Heart className="mx-auto h-5 w-5 text-[var(--w-accent)]" />
          <div className="inv-prose inv-body mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-[var(--w-text)]/80">
            {splitParagraphs(content.body).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {content.note ? (
            <p className="inv-body mx-auto mt-4 max-w-lg border-t border-[var(--w-card-border)] pt-4 text-xs leading-relaxed text-[var(--w-muted)]">
              {content.note}
            </p>
          ) : null}
          {links.length ? (
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {links.map((link: LinkEntry, index: number) => {
                const url = safeExternalUrl(link.url)
                if (!url) return null
                return (
                  <a key={`${link.label}-${index}`} href={url} target="_blank" rel="noreferrer" className="inv-btn inv-btn--outline">
                    {link.label} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function TravelSection({ section }: SectionProps) {
  const content = section.content
  const hotels = Array.isArray(content.hotels) ? content.hotels : []
  return (
    <section id={`section-${section.id}`} className="inv-section" style={{ background: 'var(--w-surface-alt)' }}>
      <div className="inv-container">
        <SectionIntro eyebrow={content.eyebrow ?? 'For guests from near & far'} heading={content.heading} intro={content.intro} />
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {hotels.map((hotel, index) => {
            const url = safeExternalUrl(hotel.url)
            return (
              <div key={`${hotel.name}-${index}`} className="inv-card p-6">
                <p className="inv-eyebrow">Stay</p>
                <h3 className="inv-display mt-1.5 text-2xl">{hotel.name}</h3>
                {hotel.description ? <p className="inv-body mt-2 text-sm leading-relaxed text-[var(--w-muted)]">{hotel.description}</p> : null}
                {hotel.address ? <p className="mt-2 text-xs text-[var(--w-muted)]">{hotel.address}</p> : null}
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="inv-btn inv-btn--text mt-4">
                    View stay <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            )
          })}
        </div>
        {content.body ? <p className="inv-body mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-[var(--w-muted)]">{content.body}</p> : null}
        {content.note ? <p className="mt-3 text-center text-xs italic text-[var(--w-muted)]">{content.note}</p> : null}
      </div>
    </section>
  )
}

function VideoSection({ section }: SectionProps) {
  const content = section.content
  const provider = content.provider === 'vimeo' ? 'vimeo' : 'youtube'
  const embed = provider === 'vimeo' ? vimeoEmbedUrl(content.video_url) : youtubeEmbedUrl(content.video_url)
  const direct = safeExternalUrl(content.video_url)

  return (
    <section id={`section-${section.id}`} className="inv-section">
      <div className="inv-container mx-auto max-w-4xl">
        <SectionIntro eyebrow={content.eyebrow ?? 'A film'} heading={content.heading} intro={content.intro} />
        <div className="mt-8 overflow-hidden rounded-[var(--w-card-radius)] border border-[var(--w-card-border)] bg-[var(--w-text)]">
          {embed ? (
            <div className="aspect-video">
              <iframe
                src={embed}
                title={content.heading ?? 'Wedding film'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-4 p-6 text-center text-white/60">
              <Play className="h-8 w-8" />
              <p className="max-w-md text-sm">{direct ? 'Watch the film in a new window.' : 'Add a YouTube or Vimeo link to share your film.'}</p>
              {direct ? (
                <a href={direct} target="_blank" rel="noreferrer" className="inv-btn inv-btn--outline border-white/40 !text-white">
                  Watch film <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          )}
        </div>
        {content.caption ? <p className="mt-3 text-center text-xs italic text-[var(--w-muted)]">{content.caption}</p> : null}
      </div>
    </section>
  )
}

function ContactSection({ section }: SectionProps) {
  const content = section.content
  const contacts = Array.isArray(content.contacts) ? content.contacts : []
  return (
    <section id={`section-${section.id}`} className="inv-section">
      <div className="inv-container">
        <SectionIntro eyebrow={content.eyebrow ?? 'Here to help'} heading={content.heading ?? 'With a Little Help'} intro={content.intro} />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact, index) => (
            <div key={`${contact.name}-${index}`} className="inv-card p-6 text-center">
              <p className="font-display text-2xl">{contact.name}</p>
              {contact.role ? <p className="inv-eyebrow mt-1">{contact.role}</p> : null}
              <div className="mt-4 flex flex-col items-center gap-2 text-sm">
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 text-[var(--w-muted)] hover:text-[var(--w-primary)]">
                    <Phone className="h-3.5 w-3.5" /> {contact.phone}
                  </a>
                ) : null}
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 text-[var(--w-muted)] hover:text-[var(--w-primary)]">
                    <Mail className="h-3.5 w-3.5" /> {contact.email}
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SectionRenderer({ section, invitation }: SectionProps) {
  switch (section.type) {
    case 'hero':
      return <HeroSection section={section} invitation={invitation} />
    case 'countdown':
      return <CountdownSection section={section} invitation={invitation} />
    case 'story':
      return <StorySection section={section} invitation={invitation} />
    case 'quote':
      return <QuoteSection section={section} invitation={invitation} />
    case 'events':
      return <EventsSection section={section} invitation={invitation} />
    case 'gallery':
      return <GallerySection section={section} invitation={invitation} />
    case 'venue':
      return <VenueSection section={section} invitation={invitation} />
    case 'rsvp':
      return <RsvpSection section={section} invitation={invitation} />
    case 'text':
      return <TextSection section={section} invitation={invitation} />
    case 'image_text':
      return <ImageTextSection section={section} invitation={invitation} />
    case 'wedding_party':
      return <WeddingPartySection section={section} invitation={invitation} />
    case 'gifts':
      return <GiftsSection section={section} invitation={invitation} />
    case 'travel':
      return <TravelSection section={section} invitation={invitation} />
    case 'video':
      return <VideoSection section={section} invitation={invitation} />
    case 'contact':
      return <ContactSection section={section} invitation={invitation} />
    case 'divider':
      return (
        <section id={`section-${section.id}`} className="py-10 text-center">
          <Ornament type={invitation.theme.tokens.ornaments.divider} width={110} />
        </section>
      )
    default:
      return null
  }
}
