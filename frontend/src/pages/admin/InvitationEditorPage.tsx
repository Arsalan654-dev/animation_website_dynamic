import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Copy,
  ExternalLink,
  Eye,
  LayoutList,
  Mail,
  MoreHorizontal,
  Palette,
  Send,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { STATUS_META } from '@/lib/constants'
import { assetUrl, cn, copyToClipboard, formatShortDate, invitationPublicUrl } from '@/lib/utils'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Badge, EmptyState, PageLoader, Tabs } from '@/components/ui/Primitives'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { OverviewTab } from '@/components/admin/invitation/OverviewTab'
import { DesignTab } from '@/components/admin/invitation/DesignTab'
import { SectionsTab } from '@/components/admin/invitation/SectionsTab'
import { EventsTab } from '@/components/admin/invitation/EventsTab'
import { RsvpTab } from '@/components/admin/invitation/RsvpTab'
import { GuestsTab } from '@/components/admin/invitation/GuestsTab'
import type { AnimationPreset, ApiEnvelope, Invitation, Theme } from '@/types'

type EditorTab = 'overview' | 'design' | 'sections' | 'events' | 'rsvp' | 'guests'
type ConfirmAction = 'archive' | 'delete' | 'unpublish' | 'restore'

export function InvitationEditorPage() {
  const { id = '' } = useParams()
  const invitationId = Number(id)
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as EditorTab) || 'overview'
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const invitationQuery = useQuery({
    queryKey: ['invitation', invitationId],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Invitation>>(`/invitations/${invitationId}`)
      return data.data
    },
    enabled: Number.isFinite(invitationId) && invitationId > 0,
  })

  const themesQuery = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Theme[] }>('/themes')
      return data.data
    },
  })

  const presetsQuery = useQuery({
    queryKey: ['animation-presets'],
    queryFn: async () => {
      const { data } = await api.get<{ data: AnimationPreset[] }>('/animation-presets')
      return data.data
    },
  })

  const invitation = invitationQuery.data
  const themes = themesQuery.data ?? []
  const presets = presetsQuery.data ?? []

  useDocumentTitle(invitation ? `${invitation.title} — Ever After Studio` : 'Invitation — Ever After Studio')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invitation', invitationId] })
    queryClient.invalidateQueries({ queryKey: ['invitations'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const statusAction = useMutation({
    mutationFn: async (action: ConfirmAction | 'publish' | 'duplicate') => {
      switch (action) {
        case 'publish':
          await api.post(`/invitations/${invitationId}/publish`)
          return action
        case 'unpublish':
          await api.post(`/invitations/${invitationId}/unpublish`)
          return action
        case 'archive':
          await api.post(`/invitations/${invitationId}/archive`)
          return action
        case 'restore':
          await api.post(`/invitations/${invitationId}/restore`)
          return action
        case 'duplicate': {
          const { data } = await api.post<ApiEnvelope<Invitation>>(`/invitations/${invitationId}/duplicate`)
          return data.data
        }
        case 'delete':
          await api.delete(`/invitations/${invitationId}`)
          return action
      }
    },
    onSuccess: (result) => {
      setConfirm(null)
      setMenuOpen(false)
      if (result && typeof result === 'object' && 'id' in result) {
        queryClient.invalidateQueries({ queryKey: ['invitations'] })
        toast({ title: 'Draft copy created', description: 'Opening the new invitation.', tone: 'success' })
        navigate(`/admin/invitations/${result.id}/edit?tab=overview`)
        return
      }
      if (result === 'delete') {
        queryClient.invalidateQueries({ queryKey: ['invitations'] })
        toast({ title: 'Invitation deleted', tone: 'success' })
        navigate('/admin/invitations')
        return
      }
      invalidate()
      const messages: Record<string, string> = {
        publish: 'Invitation published. It is live for guests.',
        unpublish: 'Invitation moved back to drafts.',
        archive: 'Invitation archived.',
        restore: 'Invitation restored to drafts.',
      }
      toast({ title: messages[String(result)] ?? 'Saved', tone: 'success' })
    },
    onError: (error) => {
      setConfirm(null)
      toast({ title: 'Could not update the invitation', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  if (invitationQuery.isLoading) return <PageLoader label="Opening the invitation" />

  if (invitationQuery.isError || !invitation) {
    return (
      <EmptyState
        title="This invitation could not be opened"
        description={getApiErrorMessage(invitationQuery.error)}
        action={
          <div className="flex gap-2">
            <Button onClick={() => invitationQuery.refetch()} variant="outline">
              Try again
            </Button>
            <Link to="/admin/invitations" className="btn-primary">
              Back to invitations
            </Link>
          </div>
        }
      />
    )
  }

  const cover = assetUrl(invitation.cover_image_path)
  const statusMeta = STATUS_META[invitation.status]
  const tabs: Array<{ value: EditorTab; label: string; count?: number }> = [
    { value: 'overview', label: 'Overview' },
    { value: 'design', label: 'Design' },
    { value: 'sections', label: 'Sections', count: invitation.sections.length },
    { value: 'events', label: 'Events', count: invitation.events.length },
    { value: 'rsvp', label: 'RSVP' },
    { value: 'guests', label: 'Guests', count: invitation.stats?.guests_count },
  ]

  const copyLink = async () => {
    const copied = await copyToClipboard(invitationPublicUrl(invitation.slug))
    toast({
      title: copied ? 'Public link copied' : 'Could not copy the link',
      description: copied ? 'Share it with your guests.' : 'Your browser blocked clipboard access.',
      tone: copied ? 'success' : 'error',
    })
  }

  return (
    <div>
      <Link
        to="/admin/invitations"
        className="mb-5 inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/40 transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to invitations
      </Link>

      <section className="relative mb-5 overflow-hidden rounded-2xl border border-ink/10 bg-wine-deep text-cream">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:18px_18px]" />
        <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/15 sm:block">
              {cover ? (
                <img src={cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/[0.06] font-script text-3xl text-gold">
                  {invitation.couple_details.partner_one?.[0]}
                  <span className="mx-1 text-lg">&amp;</span>
                  {invitation.couple_details.partner_two?.[0]}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={statusMeta.tone === 'green' ? 'green' : statusMeta.tone === 'amber' ? 'amber' : 'neutral'}
                  className="border-white/20 bg-white/10 text-cream/80"
                >
                  {statusMeta.label}
                </Badge>
                <span className="text-[0.55rem] uppercase tracking-[0.2em] text-cream/35">
                  {invitation.theme?.name ?? 'No theme'} · {invitation.sections.length} sections
                </span>
              </div>
              <h1 className="mt-1.5 truncate font-display text-3xl leading-tight sm:text-4xl">{invitation.title}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.62rem] uppercase tracking-[0.16em] text-cream/45">
                <span>{invitation.event?.formatted ?? 'Date to be announced'}</span>
                {invitation.venue_name ? <span>· {invitation.venue_name}</span> : null}
                <span>· Edited {invitation.updated_at ? formatShortDate(invitation.updated_at) : 'just now'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={copyLink} className="btn-sm btn-ghost !text-cream/60 hover:!bg-white/10 hover:!text-cream">
              <Copy className="h-3.5 w-3.5" /> Copy link
            </button>
            <Link
              to={`/admin/invitations/${invitation.id}/preview`}
              className="btn-sm btn-outline !border-white/20 !text-cream/75 hover:!border-white/40 hover:!bg-white/5"
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </Link>
            {invitation.status === 'published' ? (
              <a
                href={`/i/${invitation.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn-sm btn-outline !border-white/20 !text-cream/75 hover:!border-white/40 hover:!bg-white/5"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Live site
              </a>
            ) : null}
            {invitation.status === 'draft' ? (
              <Button
                type="button"
                variant="gold"
                size="sm"
                onClick={() => statusAction.mutate('publish')}
                isLoading={statusAction.isPending}
                icon={<Send className="h-3.5 w-3.5" />}
              >
                Publish
              </Button>
            ) : null}

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className={cn('btn-icon !text-cream/55 hover:!bg-white/10 hover:!text-cream', menuOpen && '!bg-white/10')}
                aria-label="More invitation actions"
                aria-expanded={menuOpen}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-ink/10 bg-cream py-1.5 shadow-lift">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-ink/70 transition hover:bg-paper hover:text-ink"
                    onClick={() => statusAction.mutate('duplicate')}
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate as draft
                  </button>
                  {invitation.status === 'published' ? (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-ink/70 transition hover:bg-paper hover:text-ink"
                      onClick={() => setConfirm('unpublish')}
                    >
                      <Undo2 className="h-3.5 w-3.5" /> Move back to drafts
                    </button>
                  ) : null}
                  {invitation.status === 'archived' ? (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-ink/70 transition hover:bg-paper hover:text-ink"
                      onClick={() => setConfirm('restore')}
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" /> Restore invitation
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-ink/70 transition hover:bg-paper hover:text-ink"
                      onClick={() => setConfirm('archive')}
                    >
                      <Archive className="h-3.5 w-3.5" /> Archive invitation
                    </button>
                  )}
                  <div className="my-1 h-px bg-ink/[0.07]" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-[#9b3434] transition hover:bg-[#9b3434]/[0.06]"
                    onClick={() => setConfirm('delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete permanently
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs tabs={tabs} value={tab} onChange={(value) => setSearchParams({ tab: value })} />
        <div className="hidden items-center gap-2 text-[0.58rem] uppercase tracking-[0.16em] text-ink/35 lg:flex">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          Everything is saved to this invitation only
        </div>
      </div>

      {tab === 'overview' ? <OverviewTab invitation={invitation} themes={themes} /> : null}
      {tab === 'design' ? <DesignTab invitation={invitation} themes={themes} presets={presets} /> : null}
      {tab === 'sections' ? <SectionsTab invitation={invitation} presets={presets} /> : null}
      {tab === 'events' ? <EventsTab invitation={invitation} /> : null}
      {tab === 'rsvp' ? <RsvpTab invitation={invitation} /> : null}
      {tab === 'guests' ? <GuestsTab invitation={invitation} /> : null}

      <div className="mt-8 grid gap-3 border-t border-ink/10 pt-5 sm:grid-cols-3">
        {[
          { icon: Palette, label: 'Design the world', value: invitation.theme?.name ?? 'Choose a theme', tab: 'design' as EditorTab },
          { icon: LayoutList, label: 'Shape the story', value: `${invitation.sections.length} sections`, tab: 'sections' as EditorTab },
          { icon: Mail, label: 'Meet your guests', value: `${invitation.stats?.rsvps_count ?? 0} replies`, tab: 'rsvp' as EditorTab },
        ].map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => setSearchParams({ tab: item.tab })}
            className="group flex items-center gap-3 rounded-xl border border-ink/10 bg-cream/60 p-3.5 text-left transition hover:border-gold hover:bg-gold/[0.05]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
              <item.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-ink/35">{item.label}</span>
              <span className="mt-0.5 block truncate font-display text-lg leading-tight text-ink group-hover:text-wine">
                {item.value}
              </span>
            </span>
          </button>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && statusAction.mutate(confirm)}
        isLoading={statusAction.isPending}
        title={
          confirm === 'delete'
            ? 'Delete this invitation?'
            : confirm === 'archive'
              ? 'Archive this invitation?'
              : confirm === 'restore'
                ? 'Restore this invitation?'
                : 'Move back to drafts?'
        }
        description={
          confirm === 'delete'
            ? `“${invitation.title}” and all of its sections, events, guests and RSVPs will be permanently removed. This cannot be undone.`
            : confirm === 'archive'
              ? `“${invitation.title}” will be hidden from the active collection. You can restore it at any time.`
              : confirm === 'restore'
                ? `“${invitation.title}” will return to your drafts, ready to edit and publish again.`
                : `“${invitation.title}” will no longer be visible to guests. Its content and RSVPs will be kept.`
        }
        confirmLabel={
          confirm === 'delete'
            ? 'Delete permanently'
            : confirm === 'archive'
              ? 'Archive'
              : confirm === 'restore'
                ? 'Restore'
                : 'Unpublish'
        }
        tone={confirm === 'restore' ? 'primary' : 'danger'}
      />
    </div>
  )
}
