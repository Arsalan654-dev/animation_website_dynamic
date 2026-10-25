import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { Ornament } from '@/components/invitation/Ornament'
import { assetUrl } from '@/lib/utils'
import type { PublicInvitation } from '@/types'

export function EnvelopeIntro({
  invitation,
  onOpen,
}: {
  invitation: PublicInvitation
  onOpen: () => void
}) {
  const [opening, setOpening] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const envelope = invitation.envelope
  const cover = assetUrl(envelope.cover_image?.url ?? invitation.cover_image)
  const card = assetUrl(envelope.card_image?.url)
  const seal = assetUrl(envelope.seal_image?.url)
  const names = `${invitation.couple.partner_one ?? ''} & ${invitation.couple.partner_two ?? ''}`

  useEffect(() => {
    const timer = window.setTimeout(() => buttonRef.current?.focus({ preventScroll: true }), 700)
    return () => window.clearTimeout(timer)
  }, [])

  const open = () => {
    if (opening) return
    setOpening(true)
    window.setTimeout(onOpen, 620)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 py-10"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: '-3%', transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] } }}
      style={{ background: invitation.theme.tokens.surfaces.pageBackground }}
    >
      {cover ? (
        <motion.img
          src={cover}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.12, opacity: 0 }}
          animate={{ scale: opening ? 1.16 : 1.02, opacity: 0.55 }}
          transition={{ duration: opening ? 1.8 : 2.4, ease: [0.16, 1, 0.3, 1] }}
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(20,12,10,0.18),rgba(20,12,10,0.82))]" />
      <div className="inv-texture opacity-[0.14] mix-blend-soft-light" />

      <motion.div
        className="relative z-10 mb-7 text-center text-[#fffaf2] sm:mb-9"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <p className="text-[0.58rem] uppercase tracking-[0.45em] text-white/60">The wedding of</p>
        <h1 className="inv-display mt-3 text-[clamp(2.6rem,8vw,4.6rem)]">{names}</h1>
        <Ornament type={invitation.theme.tokens.ornaments.divider} className="mt-4 opacity-80" width={100} />
      </motion.div>

      <div className="relative z-10 w-full max-w-[24rem] sm:max-w-[27rem]" style={{ perspective: 1200 }}>
        <motion.div
          className="relative mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Envelope back */}
          <div
            className="relative overflow-visible rounded-[10px] border border-white/25 bg-[#e8ddc9] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.8)]"
            style={{ minHeight: '21rem' }}
          >
            <div
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(115deg, rgba(90,65,40,0.35) 0, rgba(90,65,40,0.35) 1px, transparent 1px, transparent 9px)',
              }}
            />

            {/* Card */}
            <motion.div
              className="absolute inset-x-6 top-5 z-10 overflow-hidden rounded-t-[4px] bg-[#fdf7ea] text-[#2c211b] shadow-[0_18px_40px_-18px_rgba(50,30,15,0.7)]"
              initial={false}
              animate={opening ? { y: -185, rotate: -1.2 } : { y: 24, rotate: 0 }}
              transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
            >
              {card ? (
                <div className="h-28 overflow-hidden sm:h-32">
                  <img src={card} alt="" aria-hidden className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-12" />
              )}
              <div className="px-5 py-5 text-center sm:px-7">
                <p className="text-[0.5rem] uppercase tracking-[0.34em] text-[#8a7358]">
                  {invitation.couple.title ?? 'Together with their families'}
                </p>
                <p className="mt-2.5 font-display text-[1.85rem] leading-tight sm:text-[2.15rem]">{names}</p>
                <p className="mt-2 text-[0.55rem] uppercase tracking-[0.24em] text-[#7d6653]">
                  {invitation.event
                    ? `${invitation.event.formatted} · ${invitation.event.time_formatted}`
                    : 'A celebration of love'}
                </p>
                {envelope.card_message ? (
                  <p className="mt-3 font-display text-sm italic text-[#5f4a3a]">{envelope.card_message}</p>
                ) : null}
              </div>
            </motion.div>

            {/* Envelope front pocket */}
            <motion.div
              className="absolute inset-x-0 bottom-0 z-20 h-[13.5rem] overflow-hidden rounded-b-[10px] border-t border-[#c9b594]/70"
              style={{
                background: cover
                  ? `linear-gradient(rgba(232,221,201,0.88), rgba(232,221,201,0.96)), url(${cover}) center / cover`
                  : 'linear-gradient(160deg, #eee2cd, #d9c8ab)',
              }}
              animate={opening ? { y: 26, opacity: 0.96 } : { y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="absolute inset-x-0 top-0 h-20 bg-[#e2d3b9]"
                style={{ clipPath: 'polygon(0 0, 50% 78%, 100% 0, 100% 0, 50% 100%, 0 0)' }}
              />
              <div className="absolute inset-x-6 bottom-7 h-px bg-[#b7a179]/50" />
              <p className="absolute inset-x-8 bottom-9 text-center text-[0.55rem] uppercase tracking-[0.3em] text-[#7c6449]">
                {envelope.prompt || 'Open the invitation'}
              </p>
            </motion.div>

            {/* Wax seal */}
            <motion.button
              ref={buttonRef}
              type="button"
              onClick={open}
              aria-label={envelope.prompt || 'Open the invitation'}
              className="absolute bottom-[10.4rem] left-1/2 z-30 flex h-[4.6rem] w-[4.6rem] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-[#8d5b3e] bg-[#7b3a2e] text-[#f4dfc4] shadow-[0_10px_30px_-6px_rgba(43,20,10,0.75)] transition hover:scale-[1.04] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 sm:h-20 sm:w-20"
              animate={opening ? { opacity: 0, scale: 0.7, y: 12 } : { opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.45 }}
            >
              <span className="absolute inset-[6px] rounded-full border border-[#c89874]/60" />
              {seal ? (
                <img src={seal} alt="" aria-hidden className="h-full w-full rounded-full object-cover opacity-90" />
              ) : (
                <span className="font-display text-lg leading-none tracking-wide">
                  {envelope.monogram || invitation.monogram || 'E&A'}
                </span>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="relative z-10 mt-7 flex flex-col items-center gap-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
      >
        <button
          type="button"
          onClick={open}
          className="group inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-5 py-2.5 text-[0.58rem] uppercase tracking-[0.28em] text-white/75 backdrop-blur-sm transition hover:border-white/45 hover:text-white"
        >
          Open invitation
          <ArrowDown className="h-3 w-3 transition group-hover:translate-y-0.5" />
        </button>
        <p className="max-w-xs text-[0.6rem] leading-relaxed text-white/40">
          Best experienced with sound on and a moment to spare.
        </p>
      </motion.div>
    </motion.div>
  )
}
