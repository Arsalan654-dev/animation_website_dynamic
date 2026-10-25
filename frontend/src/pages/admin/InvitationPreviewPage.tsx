import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, Eye, RotateCcw } from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { InvitationSite } from '@/components/invitation/InvitationSite'
import { EmptyState, PageLoader } from '@/components/ui/Primitives'
import type { ApiEnvelope, PublicInvitation } from '@/types'

export function InvitationPreviewPage() {
  const { id = '' } = useParams()
  const invitationId = Number(id)
  const navigate = useNavigate()
  const [instance, setInstance] = useState(0)

  const query = useQuery({
    queryKey: ['invitation-preview', invitationId],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<PublicInvitation>>(`/invitations/${invitationId}/preview`)
      return data.data
    },
    enabled: Number.isFinite(invitationId) && invitationId > 0,
  })

  useDocumentTitle(
    query.data
      ? `Preview · ${query.data.couple.partner_one} & ${query.data.couple.partner_two}`
      : 'Preview — Ever After Studio',
  )

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <PageLoader label="Preparing the preview" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-6">
        <EmptyState
          title="The preview could not be opened"
          description={getApiErrorMessage(query.error)}
          action={
            <button type="button" className="btn-primary" onClick={() => navigate(`/admin/invitations/${id}/edit`)}>
              Back to the editor
            </button>
          }
        />
      </div>
    )
  }

  const invitation = query.data

  const replay = () => {
    try {
      sessionStorage.removeItem(`everafter:opened:${invitation.slug}`)
    } catch {
      // Storage can be unavailable; remounting is enough for this visit.
    }
    setInstance((current) => current + 1)
  }

  return (
    <div className="relative">
      <InvitationSite key={instance} invitation={invitation} preview />

      <div className="fixed bottom-4 left-1/2 z-[60] flex w-[min(46rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-wrap items-center justify-between gap-2 rounded-full border border-white/15 bg-ink/90 px-3 py-2 text-cream shadow-2xl backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2.5 pl-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/15 text-gold">
            <Eye className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-cream/80">Preview mode</p>
            <p className="truncate text-[0.55rem] text-cream/35">
              {invitation.status === 'published' ? 'Live invitation' : 'Draft — only you can see this'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={replay}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-cream/55 transition hover:bg-white/10 hover:text-cream"
          >
            <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Replay</span>
          </button>
          <Link
            to={`/admin/invitations/${invitationId}/edit`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-cream/55 transition hover:bg-white/10 hover:text-cream"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Editor</span>
          </Link>
          {invitation.status === 'published' ? (
            <a
              href={`/i/${invitation.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3.5 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-ink transition hover:bg-white"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Live site
            </a>
          ) : (
            <Link
              to={`/admin/invitations/${invitationId}/edit`}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-ink transition hover:bg-gold/90"
            >
              Keep editing
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
