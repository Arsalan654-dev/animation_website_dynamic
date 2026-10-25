import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  HeartCrack,
  Mail,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, getApiErrorMessage } from '@/lib/api'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  copyToClipboard,
  downloadBlob,
  formatDateTime,
  invitationPublicUrl,
} from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, PageLoader, StatCard } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import type {
  ApiEnvelope,
  InvitationSummary,
  PaginationMeta,
  RsvpSubmission,
  RsvpSummary,
} from '@/types'

interface RsvpMeta extends PaginationMeta {
  summary: RsvpSummary
}

interface RsvpListResponse {
  data: RsvpSubmission[]
  meta: RsvpMeta
}

const ATTENDANCE_LABEL = {
  attending: 'Attending',
  declined: 'Declined',
} as const

export function RsvpsPage() {
  useDocumentTitle('RSVPs — Ever After Studio')
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [invitationId, setInvitationId] = useState(searchParams.get('invitation_id') ?? '')
  const [attendance, setAttendance] = useState<'all' | 'attending' | 'declined'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<RsvpSubmission | null>(null)
  const [notes, setNotes] = useState('')
  const [deleting, setDeleting] = useState<RsvpSubmission | null>(null)
  const [exporting, setExporting] = useState(false)
  const debouncedSearch = useDebouncedValue(search, 300)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    setNotes(detail?.admin_notes ?? '')
  }, [detail])

  const invitationsQuery = useQuery({
    queryKey: ['invitations', 'rsvp-filter'],
    queryFn: async () => {
      const { data } = await api.get<{ data: InvitationSummary[] }>('/invitations', {
        params: { per_page: 100, include_archived: 1 },
      })
      return data.data
    },
  })

  const filters = {
    invitation_id: invitationId || undefined,
    attendance: attendance === 'all' ? undefined : attendance,
    search: debouncedSearch || undefined,
    from: from || undefined,
    to: to || undefined,
  }

  const rsvpsQuery = useQuery({
    queryKey: ['rsvps', { page, ...filters }],
    queryFn: async () => {
      const { data } = await api.get<RsvpListResponse>('/rsvps', {
        params: { page, ...filters },
      })
      return data
    },
  })

  const rows = rsvpsQuery.data?.data ?? []
  const meta = rsvpsQuery.data?.meta
  const summary = meta?.summary ?? {
    total_responses: 0,
    attending_responses: 0,
    declined_responses: 0,
    confirmed_guests: 0,
  }
  const invitations = invitationsQuery.data ?? []

  const saveNotes = useMutation({
    mutationFn: async () => {
      if (!detail) throw new Error('No RSVP selected')
      const { data } = await api.patch<ApiEnvelope<RsvpSubmission>>(`/rsvps/${detail.id}`, {
        admin_notes: notes || null,
      })
      return data.data
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['rsvps'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setDetail(updated)
      toast({ title: 'Notes saved', description: `Private to the studio · ${updated.guest_name}`, tone: 'success' })
    },
    onError: (error) => toast({ title: 'Could not save the notes', description: getApiErrorMessage(error), tone: 'error' }),
  })

  const remove = useMutation({
    mutationFn: async (rsvp: RsvpSubmission) => {
      await api.delete(`/rsvps/${rsvp.id}`)
      return rsvp
    },
    onSuccess: (rsvp) => {
      queryClient.invalidateQueries({ queryKey: ['rsvps'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      if (detail?.id === rsvp.id) setDetail(null)
      setDeleting(null)
      toast({ title: 'RSVP deleted', description: rsvp.guest_name, tone: 'success' })
    },
    onError: (error) => {
      setDeleting(null)
      toast({ title: 'Could not delete the RSVP', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const exportCsv = async () => {
    setExporting(true)
    try {
      const { data } = await api.get<Blob>('/rsvps/export', {
        params: filters,
        responseType: 'blob',
      })
      const stamp = new Date().toISOString().slice(0, 10)
      downloadBlob(data, `rsvps-${stamp}.csv`)
      toast({
        title: 'CSV exported',
        description: `${meta?.total ?? summary.total_responses} replies included.`,
        tone: 'success',
      })
    } catch (error) {
      toast({ title: 'Could not export the replies', description: getApiErrorMessage(error), tone: 'error' })
    } finally {
      setExporting(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setInvitationId('')
    setAttendance('all')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const activeFilters =
    Boolean(search) || Boolean(invitationId) || attendance !== 'all' || Boolean(from) || Boolean(to)

  const copyGuestLink = async (rsvp: RsvpSubmission) => {
    if (!rsvp.invitation) return
    const base = invitationPublicUrl(rsvp.invitation.slug)
    const url = rsvp.guest_code ? `${base}?guest=${encodeURIComponent(rsvp.guest_code)}` : base
    const copied = await copyToClipboard(url)
    toast({
      title: copied ? 'Guest link copied' : 'Could not copy the link',
      description: copied ? rsvp.guest_name : url,
      tone: copied ? 'success' : 'error',
    })
  }

  return (
    <div>
      <PageHeader
        eyebrow="The reply desk"
        title={
          <>
            RSVPs,
            <span className="block italic text-wine">every yes, every note, in one place.</span>
          </>
        }
        description="Read replies across every invitation, add private studio notes, and take the guest list with you when you need it."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            isLoading={exporting}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Export CSV
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total responses" value={summary.total_responses} icon={<Mail className="h-4 w-4" />} hint="Across the current filters" />
        <StatCard label="Attending replies" value={summary.attending_responses} icon={<CheckCircle2 className="h-4 w-4" />} hint="Households saying yes" />
        <StatCard label="Declined replies" value={summary.declined_responses} icon={<HeartCrack className="h-4 w-4" />} hint="Sending love from afar" />
        <StatCard label="Confirmed guests" value={summary.confirmed_guests} icon={<Users className="h-4 w-4" />} hint="Seats to plan for" accent />
      </div>

      <section className="admin-card mb-5 p-4">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search guest name, email or phone"
              className="pl-9"
              aria-label="Search RSVPs"
            />
          </div>
          <div className="lg:col-span-3">
            <Select
              value={invitationId}
              onChange={(event) => {
                setInvitationId(event.target.value)
                setPage(1)
              }}
              aria-label="Filter by invitation"
            >
              <option value="">Every invitation</option>
              {invitations.map((invitation) => (
                <option key={invitation.id} value={invitation.id}>
                  {invitation.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Select
              value={attendance}
              onChange={(event) => {
                setAttendance(event.target.value as 'all' | 'attending' | 'declined')
                setPage(1)
              }}
              aria-label="Filter by attendance"
            >
              <option value="all">All replies</option>
              <option value="attending">Attending</option>
              <option value="declined">Declined</option>
            </Select>
          </div>
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value)
                  setPage(1)
                }}
                aria-label="Replies from"
                title="Replies from"
              />
              <span className="text-[0.6rem] uppercase tracking-[0.12em] text-ink/30">to</span>
              <Input
                type="date"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value)
                  setPage(1)
                }}
                aria-label="Replies until"
                title="Replies until"
              />
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.6rem] uppercase tracking-[0.14em] text-ink/35">
            {meta ? `${meta.total} repl${meta.total === 1 ? 'y' : 'ies'} match` : 'Reading the reply book'}
            {activeFilters ? ' · filtered' : ''}
          </p>
          {activeFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-wine/70 underline decoration-gold/40 underline-offset-4 transition hover:text-wine"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </section>

      {rsvpsQuery.isLoading ? (
        <PageLoader label="Reading the reply book" />
      ) : rsvpsQuery.isError ? (
        <EmptyState
          title="The replies could not be loaded"
          description={getApiErrorMessage(rsvpsQuery.error)}
          action={<Button onClick={() => rsvpsQuery.refetch()}>Try again</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-5 w-5" />}
          title={activeFilters ? 'No replies match these filters' : 'The reply book is still blank'}
          description={
            activeFilters
              ? 'Try widening the dates or clearing the invitation filter.'
              : 'As guests reply to your published invitations, their answers and notes will arrive here.'
          }
          action={
            activeFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Link to="/admin/invitations" className="btn-outline">
                Go to invitations
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-ink/10 bg-cream/70 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 bg-paper/60">
                <tr className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/40">
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Invitation</th>
                  <th className="px-4 py-3 font-semibold">Reply</th>
                  <th className="px-4 py-3 font-semibold">Received</th>
                  <th className="px-4 py-3 font-semibold">Note</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.07]">
                {rows.map((rsvp) => (
                  <tr
                    key={rsvp.id}
                    className="cursor-pointer transition hover:bg-gold/[0.05]"
                    onClick={() => setDetail(rsvp)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{rsvp.guest_name}</p>
                      <p className="mt-0.5 truncate text-[0.65rem] text-ink/40">
                        {rsvp.email ?? rsvp.phone ?? 'No contact shared'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {rsvp.invitation ? (
                        <Link
                          to={`/admin/invitations/${rsvp.invitation.id}/edit`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex max-w-[15rem] items-center gap-1.5 truncate text-xs text-ink/55 hover:text-wine"
                        >
                          <span className="truncate">{rsvp.invitation.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-xs text-ink/30">Removed</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={rsvp.attendance === 'attending' ? 'green' : 'neutral'}>
                        {ATTENDANCE_LABEL[rsvp.attendance]}
                      </Badge>
                      {rsvp.attendance === 'attending' ? (
                        <p className="mt-1 text-[0.6rem] text-ink/35">
                          {rsvp.guest_count} guest{rsvp.guest_count === 1 ? '' : 's'}
                        </p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-ink/45">
                      {formatDateTime(rsvp.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {rsvp.message || rsvp.admin_notes ? (
                        <span className="inline-flex items-center gap-1 text-[0.6rem] uppercase tracking-[0.12em] text-gold">
                          <Mail className="h-3 w-3" />
                          {rsvp.admin_notes ? 'Noted' : 'Message'}
                        </span>
                      ) : (
                        <span className="text-[0.6rem] text-ink/25">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={(event) => {
                            event.stopPropagation()
                            void copyGuestLink(rsvp)
                          }}
                          aria-label="Copy guest link"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon hover:text-[#9b3434]"
                          onClick={(event) => {
                            event.stopPropagation()
                            setDeleting(rsvp)
                          }}
                          aria-label="Delete RSVP"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {rows.map((rsvp) => (
              <button
                key={rsvp.id}
                type="button"
                onClick={() => setDetail(rsvp)}
                className="block w-full rounded-xl border border-ink/10 bg-cream/70 p-4 text-left transition active:bg-gold/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-xl leading-tight text-ink">{rsvp.guest_name}</p>
                    <p className="mt-0.5 truncate text-[0.65rem] text-ink/40">
                      {rsvp.invitation?.title ?? 'Invitation removed'}
                    </p>
                  </div>
                  <Badge tone={rsvp.attendance === 'attending' ? 'green' : 'neutral'}>
                    {ATTENDANCE_LABEL[rsvp.attendance]}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6rem] text-ink/40">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDateTime(rsvp.created_at)}
                  </span>
                  {rsvp.attendance === 'attending' ? (
                    <span>
                      {rsvp.guest_count} guest{rsvp.guest_count === 1 ? '' : 's'}
                    </span>
                  ) : null}
                  {rsvp.message ? <span className="text-gold">Has a message</span> : null}
                </div>
              </button>
            ))}
          </div>

          {meta && meta.last_page > 1 ? (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-ink/10 pt-4 sm:flex-row">
              <p className="text-xs text-ink/40">
                Page {meta.current_page} of {meta.last_page} · {meta.total} replies
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
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

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        width="lg"
        title={detail ? detail.guest_name : 'RSVP details'}
        description={detail?.invitation ? `Reply to ${detail.invitation.title}` : 'Reply details'}
        footer={
          detail ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                className="text-[#8c2d2d] hover:bg-[#9b3434]/10"
                onClick={() => setDeleting(detail)}
                icon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Delete reply
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" type="button" onClick={() => setDetail(null)}>
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => saveNotes.mutate()}
                  isLoading={saveNotes.isPending}
                >
                  Save notes
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {detail ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={detail.attendance === 'attending' ? 'green' : 'neutral'}>
                {ATTENDANCE_LABEL[detail.attendance]}
              </Badge>
              {detail.attendance === 'attending' ? (
                <Badge tone="gold">
                  {detail.guest_count} guest{detail.guest_count === 1 ? '' : 's'}
                </Badge>
              ) : null}
              {detail.source ? <Badge tone="neutral">{detail.source}</Badge> : null}
            </div>

            <div className="grid gap-3 rounded-xl border border-ink/10 bg-cream/50 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/35">Email</p>
                <p className="mt-0.5 break-all text-ink/70">{detail.email ?? 'Not shared'}</p>
              </div>
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/35">Phone</p>
                <p className="mt-0.5 text-ink/70">{detail.phone ?? 'Not shared'}</p>
              </div>
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/35">Received</p>
                <p className="mt-0.5 text-ink/70">{formatDateTime(detail.created_at)}</p>
              </div>
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/35">Guest code</p>
                <p className="mt-0.5 font-mono text-xs uppercase tracking-[0.12em] text-ink/70">
                  {detail.guest_code ?? '—'}
                </p>
              </div>
            </div>

            {detail.message ? (
              <section>
                <p className="admin-label">Message for the couple</p>
                <blockquote className="rounded-xl border-l-2 border-gold bg-gold/[0.06] px-4 py-3 text-sm leading-relaxed text-ink/70">
                  {detail.message}
                </blockquote>
              </section>
            ) : null}

            {detail.answers && Object.keys(detail.answers).length > 0 ? (
              <section>
                <p className="admin-label">Answers to your questions</p>
                <dl className="divide-y divide-ink/[0.07] rounded-xl border border-ink/10 bg-paper/50">
                  {Object.entries(detail.answers).map(([question, answer]) => (
                    <div key={question} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                      <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-ink/40">{question.replace(/_/g, ' ')}</dt>
                      <dd className="text-sm text-ink/70 sm:text-right">{String(answer)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <section>
              <Field label="Private studio notes" hint="Only visible to the studio team. Included in the CSV? No — these stay here.">
                <Textarea
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Dietary needs, seating notes, a follow-up call…"
                />
              </Field>
            </section>

            {detail.invitation ? (
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/admin/invitations/${detail.invitation.id}/edit`} className="btn-outline btn-sm">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open invitation
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void copyGuestLink(detail)}
                  icon={<Copy className="h-3.5 w-3.5" />}
                >
                  Copy guest link
                </Button>
                {detail.guest_code ? (
                  <Link
                    to={`/i/${detail.invitation.slug}?guest=${encodeURIComponent(detail.guest_code)}`}
                    target="_blank"
                    className="btn-ghost btn-sm"
                  >
                    View personal invitation
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
        isLoading={remove.isPending}
        title="Delete this RSVP?"
        description={`“${deleting?.guest_name ?? 'This reply'}” will be removed permanently, along with their message and notes. This cannot be undone.`}
        confirmLabel="Delete reply"
      />
    </div>
  )
}
