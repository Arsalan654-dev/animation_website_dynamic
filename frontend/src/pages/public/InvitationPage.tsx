import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowLeft, HeartCrack } from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { InvitationSite } from '@/components/invitation/InvitationSite'
import { Ornament } from '@/components/invitation/Ornament'
import type { ApiEnvelope, PublicInvitation } from '@/types'

export function InvitationPage() {
  const { slug = '' } = useParams()

  const query = useQuery({
    queryKey: ['public-invitation', slug],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<PublicInvitation>>(`/public/invitations/${slug}`)
      return data.data
    },
    enabled: Boolean(slug),
    retry: 1,
  })

  useDocumentTitle(
    query.data
      ? `${query.data.couple.partner_one} & ${query.data.couple.partner_two} — Wedding Invitation`
      : 'Wedding Invitation',
  )

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-gold/40">
            <span className="absolute inset-2 animate-ping rounded-full border border-gold/20" />
            <span className="font-script text-3xl text-wine">E</span>
          </div>
          <Ornament className="mt-8 text-wine/40" />
          <p className="mt-5 text-[0.58rem] uppercase tracking-[0.32em] text-ink/35">Opening the invitation</p>
        </motion.div>
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-paper px-6 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgba(74,31,44,0.16)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="relative max-w-lg">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-wine/15 bg-wine/5 text-wine">
            <HeartCrack className="h-6 w-6" />
          </span>
          <p className="admin-eyebrow mt-6">Invitation unavailable</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
            This invitation could not be found
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink/55">
            {getApiErrorMessage(query.error)} It may have been renamed, unpublished or the link may be incomplete. Please
            ask the couple for a fresh link.
          </p>
          <Link to="/" className="btn-outline mt-7">
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to the studio
          </Link>
        </div>
      </div>
    )
  }

  return <InvitationSite invitation={query.data} />
}
