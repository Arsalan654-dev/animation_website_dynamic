import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  Copy,
  Eye,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState, PageHeader, PageLoader, Badge } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { assetUrl, cn, copyToClipboard, formatShortDate, invitationPublicUrl } from '@/lib/utils'
import { STATUS_META } from '@/lib/constants'
import type { InvitationSummary, PaginationMeta } from '@/types'

interface InvitationListResponse {
  data: InvitationSummary[]
  meta: PaginationMeta
}

type ConfirmAction = 'archive' | 'delete' | 'unpublish'

function ActionMenu({
  invitation,
  onAction,
}: {
  invitation: InvitationSummary
  onAction: (action: string, invitation: InvitationSummary) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const run = (action: string) => {
    setOpen(false)
    onAction(action, invitation)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn('btn-icon', open && 'bg-ink/[0.06] text-ink')}
        aria-label={`More actions for ${invitation.title}`}
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-52 overflow-hidden rounded-xl border border-ink/10 bg-cream py-1.5 shadow-lift">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-ink/70 transition hover:bg-paper hover:text-ink"
            onClick={() => {
              setOpen(false)
              navigate(`/admin/invitations/${invitation.id}/preview`)
            }}
          >
            <Eye className="h-3.5 w-3.5" /> Preview invitation
          </button>
          {invitation.status === 'published' ? (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-ink/70 transition hover:bg-paper hover:text-ink"
              onClick={() => {
                setOpen(false)
                window.open(`/i/${invitation.slug}`, '_blank', 'noopener,noreferrer')
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open public site
            </button>
          ) : null}
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-ink/70 transition hover:bg-paper hover:text-ink"
            onClick={async () => {
              setOpen(false)
              const copied = await copyToClipboard(invitationPublicUrl(invitation.slug))
              toast({
                title: copied ? 'Link copied' : 'Could not copy the link',
                description: copied ? 'The public invitation URL is on your clipboard.' : 'Your browser blocked clipboard access.',
                tone: copied ? 'success' : 'error',
              })
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Copy public link
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-ink/70 transition hover:bg-paper hover:text-ink"
            onClick={() => run('duplicate')}
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate as draft
          </button>
          <div className="my-1 h-px bg-ink/[0.07]" />
          {invitation.status === 'published' ? (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-ink/70 transition hover:bg-paper hover:text-ink"
              onClick={() => run('unpublish')}
            >
              <Undo2 className="h-3.5 w-3.5" /> Move back to drafts
            </button>
          ) : null}
          {invitation.status === 'archived' ? (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-ink/70 transition hover:bg-paper hover:text-ink"
              onClick={() => run('restore')}
            >
              <ArchiveRestore className="h-3.5 w-3.5" /> Restore invitation
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-ink/70 transition hover:bg-paper hover:text-ink"
              onClick={() => run('archive')}
            >
              <Archive className="h-3.5 w-3.5" /> Archive invitation
            </button>
          )}
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs text-[#9b3434] transition hover:bg-[#9b3434]/[0.06]"
            onClick={() => run('delete')}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete permanently
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function InvitationsPage() {
  useDocumentTitle('Invitations — Ever After Studio')
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<{ action: ConfirmAction; invitation: InvitationSummary } | null>(null)
  const debouncedSearch = useDebouncedValue(search, 350)

  useEffect(() => {
    setPage(1)
  }, [status, debouncedSearch])

  const query = useQuery({
    queryKey: ['invitations', { page, status, search: debouncedSearch }],
    queryFn: async () => {
      const { data } = await api.get<InvitationListResponse>('/invitations', {
        params: {
          page,
          status: status || undefined,
          search: debouncedSearch || undefined,
        },
      })
      return data
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ action, invitation }: { action: string; invitation: InvitationSummary }) => {
      switch (action) {
        case 'publish':
          return api.post(`/invitations/${invitation.id}/publish`)
        case 'unpublish':
          return api.post(`/invitations/${invitation.id}/unpublish`)
        case 'archive':
          return api.post(`/invitations/${invitation.id}/archive`)
        case 'restore':
          return api.post(`/invitations/${invitation.id}/restore`)
        case 'duplicate':
          return api.post(`/invitations/${invitation.id}/duplicate`)
        case 'delete':
          return api.delete(`/invitations/${invitation.id}`)
        default:
          throw new Error('Unknown action')
      }
    },
    onSuccess: (_, variables) => {
      const messages: Record<string, string> = {
        publish: 'Invitation published.',
        unpublish: 'Invitation moved back to drafts.',
        archive: 'Invitation archived.',
        restore: 'Invitation restored.',
        duplicate: 'A draft copy has been created.',
        delete: 'Invitation deleted.',
      }
      toast({ title: messages[variables.action] ?? 'Done', tone: 'success' })
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setConfirm(null)
    },
    onError: (error) => {
      toast({ title: 'Action failed', description: getApiErrorMessage(error), tone: 'error' })
      setConfirm(null)
    },
  })

  const handleAction = (action: string, invitation: InvitationSummary) => {
    if (action === 'archive' || action === 'delete' || action === 'unpublish') {
      setConfirm({ action, invitation })
      return
    }
    actionMutation.mutate({ action, invitation })
  }

  const invitations = query.data?.data ?? []
  const meta = query.data?.meta
  const isArchiveView = status === 'archived'

  return (
    <div>
      <PageHeader
        eyebrow="The collection"
        title={
          <>
            Invitations,
            <span className="block italic text-wine">each with its own world.</span>
          </>
        }
        description="Draft, design, publish and revisit every invitation from one collection. Archived celebrations stay safely out of the way."
        actions={
          <Link to="/admin/invitations/new" className="btn-primary">
            <Plus className="h-3.5 w-3.5" /> New invitation
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full border border-ink/10 bg-cream/60 p-1">
          {[
            { value: '', label: 'All active' },
            { value: 'draft', label: 'Drafts' },
            { value: 'published', label: 'Published' },
            { value: 'archived', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.value || 'all'}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.14em] transition',
                status === tab.value ? 'bg-ink text-cream' : 'text-ink/50 hover:bg-ink/[0.05] hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search names, slug or venue"
            className="admin-input pl-10"
            aria-label="Search invitations"
          />
        </div>
      </div>

      {query.isLoading ? (
        <PageLoader label="Opening the collection" />
      ) : query.isError ? (
        <EmptyState
          title="The collection could not be loaded"
          description={getApiErrorMessage(query.error)}
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
        />
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title={isArchiveView ? 'The archive is empty' : 'Your first invitation is waiting'}
          description={
            isArchiveView
              ? 'When you archive a celebration it will be kept here, safe and out of the way.'
              : 'Start with a theme and a template, then shape the story section by section. Nothing is published until you say so.'
          }
          action={
            !isArchiveView ? (
              <Link to="/admin/invitations/new" className="btn-primary">
                <Plus className="h-3.5 w-3.5" /> Create an invitation
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {invitations.map((invitation) => {
              const cover = assetUrl(invitation.cover_image_path)
              const accent = invitation.theme?.tokens.colors.primary ?? '#4a1f2c'
              const surface = invitation.theme?.tokens.colors.surface ?? '#f6f0e5'
              const statusMeta = STATUS_META[invitation.status]

              return (
                <article
                  key={invitation.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-cream/85 shadow-[0_20px_50px_-40px_rgba(36,27,23,0.6)] transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <Link to={`/admin/invitations/${invitation.id}/edit`} className="relative block aspect-[16/10] overflow-hidden">
                    {cover ? (
                      <img
                        src={cover}
                        alt={invitation.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ background: `linear-gradient(145deg, ${accent}, ${surface})` }}
                      >
                        <span className="font-display text-4xl" style={{ color: '#fdfaf3' }}>
                          {invitation.couple_details.partner_one?.[0] ?? 'E'}
                          <span className="mx-2 font-script text-2xl">&amp;</span>
                          {invitation.couple_details.partner_two?.[0] ?? 'A'}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#150d0a]/78 via-[#150d0a]/10 to-transparent" />
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                      <Badge
                        tone={statusMeta.tone === 'green' ? 'green' : statusMeta.tone === 'amber' ? 'amber' : 'neutral'}
                        className="border-white/20 bg-black/25 text-white/85 backdrop-blur"
                      >
                        {statusMeta.label}
                      </Badge>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white/80 backdrop-blur">
                        <Pencil className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="font-display text-2xl leading-tight text-white">{invitation.title}</p>
                      <p className="mt-1 text-[0.58rem] uppercase tracking-[0.18em] text-white/60">
                        {invitation.event?.short_date ?? 'Date to be announced'}
                        {invitation.venue_name ? ` · ${invitation.venue_name}` : ''}
                      </p>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-ink/40">
                        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
                        {invitation.theme?.name ?? 'No theme'}
                      </span>
                      <span className="text-[0.58rem] uppercase tracking-[0.12em] text-ink/30">
                        {invitation.updated_at ? `Edited ${formatShortDate(invitation.updated_at)}` : 'New'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-ink/[0.07] bg-paper/60 py-2 text-center">
                      <div>
                        <p className="font-display text-lg leading-none text-ink">{invitation.sections_count ?? 0}</p>
                        <p className="mt-1 text-[0.5rem] uppercase tracking-[0.14em] text-ink/35">Sections</p>
                      </div>
                      <div className="border-x border-ink/[0.07]">
                        <p className="font-display text-lg leading-none text-ink">{invitation.rsvps_count ?? 0}</p>
                        <p className="mt-1 text-[0.5rem] uppercase tracking-[0.14em] text-ink/35">Replies</p>
                      </div>
                      <div>
                        <p className="font-display text-lg leading-none text-ink">{invitation.confirmed_guests ?? 0}</p>
                        <p className="mt-1 text-[0.5rem] uppercase tracking-[0.14em] text-ink/35">Guests</p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-1 pt-4">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/admin/invitations/${invitation.id}/edit`}
                          className="btn-sm btn-outline !px-3"
                          aria-label={`Edit ${invitation.title}`}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Link>
                        <Link
                          to={`/admin/invitations/${invitation.id}/preview`}
                          className="btn-icon"
                          aria-label={`Preview ${invitation.title}`}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-1">
                        {invitation.status === 'draft' ? (
                          <button
                            type="button"
                            onClick={() => actionMutation.mutate({ action: 'publish', invitation })}
                            className="btn-sm btn-primary !px-3"
                            disabled={actionMutation.isPending}
                          >
                            <Send className="h-3 w-3" /> Publish
                          </button>
                        ) : null}
                        {invitation.status === 'published' ? (
                          <button
                            type="button"
                            onClick={() => window.open(`/i/${invitation.slug}`, '_blank', 'noopener,noreferrer')}
                            className="btn-icon"
                            aria-label={`Open ${invitation.title}`}
                            title="Open public invitation"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        ) : null}
                        <ActionMenu invitation={invitation} onAction={handleAction} />
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {meta && meta.last_page > 1 ? (
            <div className="mt-7 flex items-center justify-between border-t border-ink/10 pt-4 text-xs text-ink/45">
              <span>
                Page {meta.current_page} of {meta.last_page} · {meta.total} invitation{meta.total === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) actionMutation.mutate({ action: confirm.action, invitation: confirm.invitation })
        }}
        isLoading={actionMutation.isPending}
        title={
          confirm?.action === 'delete'
            ? 'Delete this invitation?'
            : confirm?.action === 'archive'
              ? 'Archive this invitation?'
              : 'Move back to drafts?'
        }
        description={
          confirm?.action === 'delete'
            ? `“${confirm.invitation.title}” and all of its sections, events and RSVPs will be permanently removed. This cannot be undone.`
            : confirm?.action === 'archive'
              ? `“${confirm.invitation.title}” will be hidden from the active collection. You can restore it at any time.`
              : `“${confirm?.invitation.title ?? ''}” will no longer be visible to guests. Its content and RSVPs will be kept.`
        }
        confirmLabel={confirm?.action === 'delete' ? 'Delete permanently' : confirm?.action === 'archive' ? 'Archive' : 'Unpublish'}
      />
    </div>
  )
}
