import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  Download,
  ExternalLink,
  LayoutGrid,
  Pencil,
  Power,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  activateInvitationDesign,
  deleteInvitationDesign,
  downloadDesignExport,
  duplicateInvitationDesign,
  fetchDesignLibrary,
} from '@/lib/designApi'
import { assetUrl, cn, formatShortDate, slugify } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge, EmptyState, PageHeader, PageLoader } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import type { ApiEnvelope, InvitationDesignSummary, Theme } from '@/types'

type LibraryStatus = 'all' | 'active' | 'drafts'
type DesignAction = 'activate' | 'duplicate' | 'delete'

const FILTERS: Array<{ value: LibraryStatus; label: string }> = [
  { value: 'all', label: 'All designs' },
  { value: 'active', label: 'Live' },
  { value: 'drafts', label: 'Drafts' },
]

export function DesignsPage() {
  useDocumentTitle('All designs — Ever After Studio')
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<LibraryStatus>('all')
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState<{ action: DesignAction; design: InvitationDesignSummary } | null>(
    null,
  )
  const debouncedSearch = useDebouncedValue(search, 350)

  useEffect(() => {
    setPage(1)
  }, [status, debouncedSearch])

  const libraryQuery = useQuery({
    queryKey: ['designs', { page, status, search: debouncedSearch }],
    queryFn: () =>
      fetchDesignLibrary({
        page,
        search: debouncedSearch || undefined,
        active: status === 'all' ? undefined : status === 'active',
      }),
  })

  const themesQuery = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const { data } = await api.get<ApiEnvelope<Theme[]>>('/themes')
      return data.data
    },
  })

  const invalidate = (design: InvitationDesignSummary) => {
    queryClient.invalidateQueries({ queryKey: ['designs'] })
    queryClient.invalidateQueries({ queryKey: ['invitation-designs', design.invitation_id] })
    queryClient.invalidateQueries({ queryKey: ['invitation-design', design.invitation_id] })
    queryClient.invalidateQueries({ queryKey: ['invitation-design-versions', design.invitation_id] })
    queryClient.invalidateQueries({ queryKey: ['invitation', design.invitation_id] })
    queryClient.invalidateQueries({ queryKey: ['invitation-preview', design.invitation_id] })
    queryClient.invalidateQueries({ queryKey: ['invitations'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['public-invitation'] })
  }

  const actionMutation = useMutation({
    mutationFn: async ({ action, design }: { action: DesignAction; design: InvitationDesignSummary }) => {
      if (action === 'activate') {
        return activateInvitationDesign(design.invitation_id, design.id)
      }
      if (action === 'duplicate') {
        return duplicateInvitationDesign(design.invitation_id, design.id)
      }
      return deleteInvitationDesign(design.invitation_id, design.id)
    },
    onSuccess: (_, variables) => {
      const messages: Record<DesignAction, { title: string; description: string }> = {
        activate: {
          title: 'Design activated',
          description: `“${variables.design.name}” is now live on its invitation.`,
        },
        duplicate: {
          title: 'Design duplicated',
          description: 'The new save slot is in the library, ready to edit.',
        },
        delete: {
          title: 'Design deleted',
          description: `“${variables.design.name}” was removed from the library.`,
        },
      }
      toast({ ...messages[variables.action], tone: 'success' })
      invalidate(variables.design)
      setConfirm(null)
    },
    onError: (error) => {
      toast({ title: 'The design action failed', description: getApiErrorMessage(error), tone: 'error' })
      setConfirm(null)
    },
  })

  const downloadMutation = useMutation({
    mutationFn: (design: InvitationDesignSummary) =>
      downloadDesignExport(
        design.invitation_id,
        design.id,
        `${design.invitation?.slug ?? 'invitation'}-${slugify(design.name) || 'design'}.html`,
      ),
    onSuccess: (_, design) => {
      toast({
        title: 'Website downloaded as HTML',
        description: `"${design.name}" is a complete .html website, ready to open anywhere. Its CDN links are live.`,
        tone: 'success',
      })
    },
    onError: (error) => {
      toast({ title: 'Could not download the design', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const designs = libraryQuery.data?.data ?? []
  const meta = libraryQuery.data?.meta
  const themes = themesQuery.data ?? []

  const handleAction = (action: DesignAction, design: InvitationDesignSummary) => {
    if (action === 'activate' || action === 'delete') {
      setConfirm({ action, design })
      return
    }
    actionMutation.mutate({ action, design })
  }

  return (
    <div>
      <PageHeader
        eyebrow="The design library"
        title={
          <>
            Every design,
            <span className="block italic text-wine">one atelier.</span>
          </>
        }
        description="Each invitation can hold many designs, but only one is live at a time. Open any save slot in the studio, activate it when it is ready, or take a standalone copy anywhere."
        actions={
          <>
            <Link to="/admin/invitations" className="btn-outline">
              Manage invitations
            </Link>
            <Link to="/admin/templates" className="btn-primary">
              <Sparkles className="h-3.5 w-3.5" /> Browse templates
            </Link>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full border border-ink/10 bg-cream/60 p-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.14em] transition',
                status === filter.value
                  ? 'bg-ink text-cream'
                  : 'text-ink/50 hover:bg-ink/[0.05] hover:text-ink',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search designs or invitations"
            className="admin-input pl-10"
            aria-label="Search designs"
          />
        </div>
      </div>

      {libraryQuery.isLoading ? (
        <PageLoader label="Opening the design library" />
      ) : libraryQuery.isError ? (
        <EmptyState
          title="The design library could not be loaded"
          description={getApiErrorMessage(libraryQuery.error)}
          action={<Button onClick={() => libraryQuery.refetch()}>Try again</Button>}
        />
      ) : designs.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-5 w-5" />}
          title={search ? 'No designs match this search' : 'The library is waiting for its first design'}
          description={
            search
              ? 'Try another name or invitation title.'
              : 'Open an invitation and visit its Designs tab. A default design is created the first time you open it.'
          }
          action={
            <Link to="/admin/invitations" className="btn-primary">
              Open an invitation
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {designs.map((design) => {
              const theme = themes.find((item) => item.id === design.theme_id) ?? null
              const cover = assetUrl(design.cover_image_path)
              const primary = theme?.tokens.colors.primary ?? '#4a1f2c'
              const accent = theme?.tokens.colors.accent ?? '#b08d57'
              const surface = theme?.tokens.colors.surface ?? '#f6f0e5'
              const studioUrl = `/admin/invitations/${design.invitation_id}/studio?design=${design.id}`
              const isDownloading =
                downloadMutation.isPending && downloadMutation.variables?.id === design.id

              return (
                <article
                  key={design.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-cream/85 shadow-[0_20px_50px_-40px_rgba(36,27,23,0.6)] transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <Link to={studioUrl} className="relative block aspect-[16/10] overflow-hidden">
                    {cover ? (
                      <img
                        src={cover}
                        alt={design.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ background: `linear-gradient(145deg, ${primary}, ${surface})` }}
                      >
                        <span className="font-display text-4xl" style={{ color: '#fdfaf3' }}>
                          {design.name.charAt(0)}
                          <span className="mx-2 font-script text-2xl" style={{ color: accent }}>
                            &amp;
                          </span>
                          {design.invitation?.title?.charAt(0) ?? 'D'}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#150d0a]/78 via-[#150d0a]/10 to-transparent" />
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                      <Badge
                        tone={design.is_active ? 'green' : 'neutral'}
                        className="border-white/20 bg-black/25 text-white/85 backdrop-blur"
                      >
                        {design.is_active ? 'Live' : 'Draft'}
                      </Badge>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white/80 backdrop-blur">
                        <Pencil className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="font-display text-2xl leading-tight text-white">{design.name}</p>
                      <p className="mt-1 text-[0.58rem] uppercase tracking-[0.18em] text-white/60">
                        {design.invitation?.title ?? 'Invitation'}
                        {design.section_count ? ` · ${design.section_count} sections` : ''}
                      </p>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-ink/40">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: primary }}
                        />
                        <span className="truncate">{theme?.name ?? 'House theme'}</span>
                      </span>
                      <span className="shrink-0 text-[0.58rem] uppercase tracking-[0.12em] text-ink/30">
                        v{design.version} ·{' '}
                        {design.updated_at ? formatShortDate(design.updated_at) : 'New'}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink/[0.07] bg-paper/60 px-3 py-2">
                      <span className="text-[0.55rem] uppercase tracking-[0.14em] text-ink/35">
                        {design.invitation?.status === 'published' ? 'Published invitation' : 'Invitation draft'}
                      </span>
                      {design.published_at ? (
                        <span className="ml-auto text-[0.52rem] uppercase tracking-[0.12em] text-ink/30">
                          Live since {formatShortDate(design.published_at)}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-1 pt-4">
                      <Link to={studioUrl} className="btn-sm btn-outline !px-3">
                        <Pencil className="h-3 w-3" /> Open studio
                      </Link>

                      <div className="flex items-center gap-0.5">
                        {!design.is_active ? (
                          <button
                            type="button"
                            onClick={() => handleAction('activate', design)}
                            className="btn-icon hover:text-[#3f6b4b]"
                            aria-label={`Activate ${design.name}`}
                            title="Activate this design"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        ) : design.invitation?.slug ? (
                          <a
                            href={`/i/${design.invitation.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-icon"
                            aria-label={`Open the live ${design.name}`}
                            title="Open the live invitation"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => downloadMutation.mutate(design)}
                          disabled={isDownloading}
                          className="btn-icon disabled:opacity-40"
                          aria-label={`Download ${design.name}`}
                          title="Download website (.html)"
                        >
                          <Download className={cn('h-4 w-4', isDownloading && 'animate-pulse')} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction('duplicate', design)}
                          disabled={actionMutation.isPending}
                          className="btn-icon disabled:opacity-40"
                          aria-label={`Duplicate ${design.name}`}
                          title="Duplicate design"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction('delete', design)}
                          disabled={design.is_active}
                          className="btn-icon hover:text-[#9b3434] disabled:opacity-25"
                          aria-label={`Delete ${design.name}`}
                          title={
                            design.is_active
                              ? 'Activate another design before deleting the live one'
                              : 'Delete design'
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                Page {meta.current_page} of {meta.last_page} · {meta.total} design
                {meta.total === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((current) => current + 1)}
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
          if (confirm) actionMutation.mutate({ action: confirm.action, design: confirm.design })
        }}
        isLoading={actionMutation.isPending}
        title={
          confirm?.action === 'activate'
            ? 'Make this design live?'
            : 'Delete this design?'
        }
        description={
          confirm?.action === 'activate'
            ? `“${confirm.design.name}” will replace the live invitation for “${confirm.design.invitation?.title ?? 'this invitation'}”. Save any studio drafts first; only the saved snapshot is activated.`
            : `“${confirm?.design.name ?? 'This design'}” will be permanently removed. The live design cannot be deleted; activate another one first.`
        }
        confirmLabel={confirm?.action === 'activate' ? 'Activate design' : 'Delete design'}
      />
    </div>
  )
}
