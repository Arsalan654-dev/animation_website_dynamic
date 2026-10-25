import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarHeart,
  Check,
  Heart,
  Layers,
  LayoutDashboard,
  Mail,
  Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Logo } from '@/components/layout/Logo'
import { Ornament } from '@/components/invitation/Ornament'
import { assetUrl, cn } from '@/lib/utils'
import type { ApiEnvelope, PublicInvitation } from '@/types'

const DEMO_SLUGS = ['maheen-and-uzair', 'amara-and-zayd']

const FEATURES = [
  {
    icon: Layers,
    title: 'A world, not a template',
    text: 'Themes, typefaces, textures, ornaments and motion are all composed in the studio — then published as one living site.',
  },
  {
    icon: CalendarHeart,
    title: 'Every celebration, in order',
    text: 'Mehndi, Nikah, Baraat, Walima. Give each event its own date, venue, dress code and map, without touching a line of code.',
  },
  {
    icon: Mail,
    title: 'RSVPs that stay with you',
    text: 'Guest codes, meal preferences and personal notes arrive in one calm dashboard, ready to export whenever you need them.',
  },
]

function DemoCard({ invitation, index }: { invitation: PublicInvitation; index: number }) {
  const cover = assetUrl(invitation.cover_image)
  const accent = invitation.theme.tokens?.colors?.primary ?? '#4a1f2c'

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-lift"
    >
      <Link to={`/i/${invitation.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={`${invitation.couple.partner_one} & ${invitation.couple.partner_two}`}
              className="h-full w-full object-cover transition duration-[1.2s] group-hover:scale-[1.04]"
            />
          ) : (
            <div className="h-full w-full" style={{ background: accent }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#160e0b]/75 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-cream sm:p-7">
            <p className="text-[0.55rem] uppercase tracking-[0.32em] text-white/60">A live invitation</p>
            <h3 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
              {invitation.couple.partner_one} <span className="font-script text-[#e7cf9f]">&amp;</span>{' '}
              {invitation.couple.partner_two}
            </h3>
            <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.2em] text-white/65">
              {invitation.event?.short_date} · {invitation.venue.name}
            </p>
          </div>
          <span className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/80 backdrop-blur transition group-hover:bg-white/20 group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-ink/40">{invitation.theme.name} theme</p>
          <span className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-gold">
            Open invitation <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}

export function LandingPage() {
  useDocumentTitle('Ever After Studio — Wedding invitations, considered')

  const demos = useQuery({
    queryKey: ['demo-invitations'],
    queryFn: async () => {
      const results = await Promise.allSettled(
        DEMO_SLUGS.map((slug) => api.get<ApiEnvelope<PublicInvitation>>(`/public/invitations/${slug}`)),
      )
      return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value.data.data] : []))
    },
    retry: false,
    staleTime: 60_000,
  })

  const cover = assetUrl('/demo/hero-couple.jpg')
  const details = assetUrl('/demo/details.jpg')

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.25] [background-image:radial-gradient(circle_at_1px_1px,rgba(74,31,44,0.2)_1px,transparent_0)] [background-size:24px_24px]" />

      <header className="relative z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 sm:px-8 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <a href="#demos" className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink/50 transition hover:text-ink">
              Demo invitations
            </a>
            <a href="#experience" className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink/50 transition hover:text-ink">
              The experience
            </a>
          </nav>
          <Link to="/admin/login" className="btn-outline btn-sm">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Studio sign in
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:px-10 lg:pb-24 lg:pt-20">
          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-wine/15 bg-cream/70 px-3 py-1.5">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-wine/60">
                Wedding invitation atelier
              </span>
            </div>

            <h1 className="mt-7 font-display text-[clamp(3.2rem,7.4vw,6.2rem)] leading-[0.92] tracking-tight text-ink">
              Invitations as
              <span className="block italic text-wine">memorable as</span>
              the day itself.
            </h1>

            <p className="mt-7 max-w-xl text-[0.95rem] leading-relaxed text-ink/55">
              Ever After Studio is a living invitation platform for modern celebrations. Compose a themed website,
              tell your story section by section, and welcome every RSVP from one quiet, considered dashboard.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#demos" className="btn-primary px-6 py-3">
                Explore the demo
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <Link to="/admin/login" className="btn-outline px-6 py-3">
                Enter the studio
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-ink/10 pt-5">
              {['Six composed themes', 'Envelope openings', 'RSVP & guest codes'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.14em] text-ink/40">
                  <Check className="h-3 w-3 text-gold" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative lg:col-span-6"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative mx-auto max-w-md lg:max-w-lg">
              <div className="absolute -left-6 -top-8 hidden h-40 w-32 rotate-[-8deg] overflow-hidden rounded-sm border-[6px] border-cream shadow-xl sm:block">
                {details ? <img src={details} alt="Bridal details on textured paper" className="h-full w-full object-cover" /> : null}
              </div>

              <div className="relative overflow-hidden rounded-sm border-[7px] border-cream bg-cream shadow-[0_50px_100px_-40px_rgba(36,27,23,0.55)]">
                {cover ? (
                  <img src={cover} alt="A couple beneath a floral arch" className="aspect-[4/5] w-full object-cover" />
                ) : (
                  <div className="aspect-[4/5] bg-wine" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b100c]/80 via-[#1b100c]/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-center text-cream">
                  <p className="text-[0.5rem] uppercase tracking-[0.4em] text-white/60">Together with their families</p>
                  <p className="mt-3 font-display text-4xl leading-none sm:text-5xl">
                    Maheen <span className="font-script text-[#e7cf9f]">&amp;</span> Uzair
                  </p>
                  <Ornament type="botanical" className="mt-4 opacity-80" width={100} />
                  <p className="mt-3 text-[0.55rem] uppercase tracking-[0.24em] text-white/60">Karachi, Pakistan</p>
                </div>
              </div>

              <div className="absolute -bottom-7 -right-4 flex items-center gap-3 rounded-xl border border-ink/10 bg-cream px-4 py-3 shadow-lift sm:-right-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-wine text-cream">
                  <Heart className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-lg leading-none text-ink">RSVP received</p>
                  <p className="mt-1 text-[0.55rem] uppercase tracking-[0.16em] text-ink/40">Every reply, in one place</p>
                </div>
              </div>

              <div className="absolute -right-2 top-8 hidden rotate-6 rounded-full border border-gold/40 bg-cream px-4 py-2 shadow-lg sm:block">
                <span className="font-script text-2xl text-wine">with love</span>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="demos" className="relative border-y border-ink/10 bg-cream/45 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="admin-eyebrow">Two stories, one studio</p>
                <h2 className="mt-2 font-display text-4xl leading-none text-ink sm:text-5xl">Step inside a real invitation</h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-ink/45">
                Each demo is published by the same platform you will use — with its own theme, sections, events,
                gallery and RSVP flow.
              </p>
            </div>

            <div className={cn('mt-9 grid gap-5 sm:grid-cols-2', demos.isLoading && 'animate-pulse')}>
              {demos.isLoading ? (
                <>
                  <div className="aspect-[4/3] rounded-2xl bg-paper-deep" />
                  <div className="aspect-[4/3] rounded-2xl bg-paper-deep" />
                </>
              ) : demos.data && demos.data.length > 0 ? (
                demos.data.map((invitation, index) => (
                  <DemoCard key={invitation.slug} invitation={invitation} index={index} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-ink/15 bg-paper p-8 sm:col-span-2">
                  <p className="font-display text-2xl text-ink">The demo invitations are waiting for the API.</p>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/50">
                    Start the Laravel backend and run the demo seeder, then this page will show two complete,
                    publishable invitations.
                  </p>
                  <Link to="/admin/login" className="btn-outline mt-5">
                    Enter the studio <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="experience" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="admin-eyebrow">Built for the whole celebration</p>
              <h2 className="mt-3 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.95] text-ink">
                The details,
                <span className="block italic text-wine">held beautifully.</span>
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink/50">
                From the first envelope to the final reply, every piece lives in the same place — easy to shape,
                effortless for your guests.
              </p>
              <Ornament className="mt-8 justify-start text-wine/30" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className="rounded-2xl border border-ink/10 bg-cream/65 p-6"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                    <feature.icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-5 font-display text-2xl leading-tight text-ink">{feature.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink/50">{feature.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-wine-deep py-16 text-cream sm:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:20px_20px]" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-gold/15" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full border border-gold/10" />
          <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
            <Ornament type="botanical" className="text-gold/70" width={120} />
            <h2 className="mt-6 font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.98]">
              Your story deserves
              <span className="block italic text-gold-soft">its own kind of beautiful.</span>
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-cream/50">
              Sign in to compose a new invitation, choose a theme and publish a site your guests will remember.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/admin/login" className="btn-gold px-6 py-3">
                Enter the studio <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link to="/i/maheen-and-uzair" className="btn-outline border-cream/25 px-6 py-3 text-cream hover:border-cream/50 hover:bg-white/5">
                Open a demo <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-center sm:flex-row sm:px-8 sm:text-left lg:px-10">
          <Logo />
          <p className="text-[0.58rem] uppercase tracking-[0.2em] text-ink/35">
            Invitations, RSVPs and memories · Made with care
          </p>
          <div className="flex items-center gap-4 text-[0.58rem] uppercase tracking-[0.16em] text-ink/40">
            <Link to="/admin/login" className="hover:text-ink">
              Studio
            </Link>
            <span className="h-3 w-px bg-ink/15" />
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
