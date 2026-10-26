import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  Download,
  ExternalLink,
  Layers,
  Pencil,
  Plus,
  Power,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { getApiErrorMessage } from '@/lib/api'
import {
  activateInvitationDesign,
  createInvitationDesign,
  deleteInvitationDesign,
  downloadDesignExport,
  duplicateInvitationDesign,
  fetchInvitationDesigns,
} from '@/lib/designApi'
import { assetUrl, cn, formatShortDate, slugify } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Badge, EmptyState, PageLoader, SectionHeading } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import type { Invitation, InvitationDesignSummary, Theme } from '@/types'

type DesignAction = 'activate' | 'duplicate' | 'delete'

interface DesignsTabProps {
  invitation: Invitation
  themes: Theme[]
}

export function DesignsTab({ invitation, themes }: DesignsTabProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [confirm, setConfirm] = useState<{ action: DesignAction; design: InvitationDesignSummary } | null>(
    null,
  )

  const designsQuery = useQuery({
    queryKey: ['invitation-designs', invitation.id],
    queryFn: () => fetchInvitationDesigns(invitation.id),
  })

  const designs = designsQuery.data ?? []
  const activeDesign = designs.find((design) => design.is_active)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invitation-designs', invitation.id] })
    queryClient.invalidateQueries({ queryKey: ['designs'] })
    queryClient.invalidateQueries({ queryKey: ['invitation', invitation.id] })
    queryClient.invalidateQueries({ queryKey: ['invitation-preview', invitation.id] })
    queryClient.invalidateQueries({ queryKey: ['invitations'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['public-invitation'] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createInvitationDesign(invitation.id, {
        name: name.trim() || `Design ${designs.length + 1}`,
        description: description.trim() || null,
      }),
    onSuccess: (design) => {
      invalidate()
      setCreateOpen(false)
      toast({
        title: 'Design created',
        description: 'It starts from the current invitation and is saved as a draft.',
        tone: 'success',
      })
      navigate(`/admin/invitations/${invitation.id}/studio?design=${design.id}`)
    },
    onError: (error) => {
      toast({ title: 'Could not create the design', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ action, design }: { action: DesignAction; design: InvitationDesignSummary }) => {
      if (action === 'activate') {
        return activateInvitationDesign(invitation.id, design.id)
      }
      if (action === 'duplicate') {
        return duplicateInvitationDesign(invitation.id, design.id)
      }
      return deleteInvitationDesign(invitation.id, design.id)
    },
    onSuccess: (_, variables) => {
      const messages: Record<DesignAction, string> = {
        activate: `“${variables.design.name}” is now live.`,
        duplicate: 'The design was duplicated as a new draft.',
        delete: `“${variables.design.name}” was deleted.`,
      }
      invalidate()
      setConfirm(null)
      toast({ title: messages[variables.action], tone: 'success' })
    },
    onError: (error) => {
      toast({ title: 'The design action failed', description: getApiErrorMessage(error), tone: 'error' })
      setConfirm(null)
    },
  })

  const downloadMutation = useMutation({
    mutationFn: (design: InvitationDesignSummary) =>
      downloadDesignExport(
        invitation.id,
        design.id,
        `${invitation.slug}-${slugify(design.name) || 'design'}.html`,
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

  const openCreate = () => {
    setName(`Design ${designs.length + 1}`)
    setDescription('')
    setCreateOpen(true)
  }

  const handleAction = (action: DesignAction, design: InvitationDesignSummary) => {
    if (action === 'activate' || action === 'delete') {
      setConfirm({ action, design })
      return
    }
    actionMutation.mutate({ action, design })
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Save slots"
        title="Designs for this invitation"
        description="Only one design is live at a time. Every design is a complete snapshot of the theme, page, envelope, sections and effects."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {activeDesign ? (
              <Link
                to={`/admin/invitations/${invitation.id}/studio?design=${activeDesign.id}`}
                className="btn-outline btn-sm"
              >
                <Sparkles className="h-3.5 w-3.5" /> Open live studio
              </Link>
            ) : null}
            <Button
              type="button"
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={openCreate}
            >
              New design
            </Button>
          </div>
        }
      />

      <div className="rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3 text-xs leading-relaxed text-ink/55">
        <strong className="font-semibold text-ink/75">How designs work.</strong> Saving a draft in the studio does not
        change the live invitation. Activating a design applies its saved snapshot to the invitation. The public site
        always reads the active design, so guests never see a half-finished draft.
      </div>

      {designsQuery.isLoading ? (
        <PageLoader label="Opening the designs" />
      ) : designsQuery.isError ? (
        <EmptyState
          title="The designs could not be loaded"
          description={getApiErrorMessage(designsQuery.error)}
          action={<Button onClick={() => designsQuery.refetch()}>Try again</Button>}
        />
      ) : designs.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-5 w-5" />}
          title="No designs yet"
          description="Create a design from the current invitation, then shape it in the studio. The first design becomes live automatically."
          action={
            <Button type="button" onClick={openCreate} icon={<Plus className="h-3.5 w-3.5" />}>
              Create a design
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {designs.map((design) => {
            const theme = themes.find((item) => item.id === design.theme_id) ?? null
            const cover = assetUrl(design.cover_image_path)
            const primary = theme?.tokens.colors.primary ?? '#4a1f2c'
            const surface = theme?.tokens.colors.surface ?? '#f6f0e5'
            const studioUrl = `/admin/invitations/${invitation.id}/studio?design=${design.id}`
            const isDownloading =
              downloadMutation.isPending && downloadMutation.variables?.id === design.id

            return (
              <article
                key={design.id}
                className={cn(
                  'flex flex-col overflow-hidden rounded-2xl border bg-cream/80 transition sm:flex-row',
                  design.is_active
                    ? 'border-gold shadow-[0_18px_45px_-35px_rgba(36,27,23,0.7)]'
                    : 'border-ink/10 hover:border-ink/20',
                )}
              >
                <Link
                  to={studioUrl}
                  className="relative block h-40 shrink-0 overflow-hidden sm:h-auto sm:w-40"
                >
                  {cover ? (
                    <img src={cover} alt={design.name} className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: `linear-gradient(145deg, ${primary}, ${surface})` }}
                    >
                      <span className="font-display text-4xl text-white/90">{design.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#150d0a]/65 to-transparent" />
                  <span className="absolute left-2 top-2">
                    <Badge
                      tone={design.is_active ? 'green' : 'neutral'}
                      className="border-white/20 bg-black/25 text-white/85 backdrop-blur"
                    >
                      {design.is_active ? 'Live' : 'Draft'}
                    </Badge>
                  </span>
                </Link>

                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={studioUrl} className="block truncate font-display text-xl leading-tight text-ink hover:text-wine">
                        {design.name}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-[0.68rem] leading-relaxed text-ink/45">
                        {design.description || 'A complete save slot for this invitation.'}
                      </p>
                    </div>
                    {design.is_active ? (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                        <Sparkles className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-ink/[0.07] bg-paper/60 py-2 text-center">
                    <div>
                      <p className="font-display text-lg leading-none text-ink">{design.section_count}</p>
                      <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-ink/35">Sections</p>
                    </div>
                    <div className="border-x border-ink/[0.07]">
                      <p className="font-display text-lg leading-none text-ink">v{design.version}</p>
                      <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-ink/35">Version</p>
                    </div>
                    <div>
                      <p className="truncate px-1 font-display text-sm leading-tight text-ink">
                        {theme?.name ?? 'House'}
                      </p>
                      <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-ink/35">Theme</p>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                    <span className="text-[0.52rem] uppercase tracking-[0.12em] text-ink/30">
                      {design.updated_at ? `Edited ${formatShortDate(design.updated_at)}` : 'New'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Link
                        to={studioUrl}
                        className="btn-icon"
                        aria-label={`Open ${design.name} in the studio`}
                        title="Open in studio"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
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
                      ) : invitation.status === 'published' ? (
                        <a
                          href={`/i/${invitation.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-icon"
                          aria-label="Open the live invitation"
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
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a design"
        description="The new design begins as a copy of the current invitation, then opens in the studio."
        size="sm"
      >
        <div className="space-y-4">
          <Field label="Design name">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              placeholder="Evening garden"
            />
          </Field>
          <Field label="Description" hint="Optional. A note for your future self.">
            <Textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              placeholder="Candlelit garden, deeper green and gold."
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={createMutation.isPending}
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => createMutation.mutate()}
            >
              Create & open studio
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) actionMutation.mutate({ action: confirm.action, design: confirm.design })
        }}
        isLoading={actionMutation.isPending}
        title={confirm?.action === 'activate' ? 'Make this design live?' : 'Delete this design?'}
        description={
          confirm?.action === 'activate'
            ? `“${confirm.design.name}” will replace the live invitation. Only the saved snapshot is activated; unsaved studio changes are not included.`
            : `“${confirm?.design.name ?? 'This design'}” will be permanently removed. The live design cannot be deleted; activate another one first.`
        }
        confirmLabel={confirm?.action === 'activate' ? 'Activate design' : 'Delete design'}
      />
    </div>
  )
}
