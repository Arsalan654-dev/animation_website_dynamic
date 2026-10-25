import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Link2, LockKeyhole, Pencil, Plus, Search, Trash2, UserCheck, UserX, Users } from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { copyToClipboard, cn, invitationPublicUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { Field, Input, Switch, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState, PageLoader } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import type { Invitation, InvitationGuest } from '@/types'

interface GuestsTabProps {
  invitation: Invitation
}

interface GuestForm {
  name: string
  email: string
  phone: string
  max_guests: number
  is_allowed: boolean
  notes: string
}

const emptyForm: GuestForm = {
  name: '',
  email: '',
  phone: '',
  max_guests: 2,
  is_allowed: true,
  notes: '',
}

export function GuestsTab({ invitation }: GuestsTabProps) {
  const [editing, setEditing] = useState<InvitationGuest | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<InvitationGuest | null>(null)
  const [form, setForm] = useState<GuestForm>(emptyForm)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const query = useQuery({
    queryKey: ['guests', invitation.id],
    queryFn: async () => {
      const { data } = await api.get<{ data: InvitationGuest[] }>(`/invitations/${invitation.id}/guests`)
      return data.data
    },
  })

  const guests = (query.data ?? []).filter((guest) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return [guest.name, guest.email, guest.phone, guest.code].some((value) => value?.toLowerCase().includes(term))
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['guests', invitation.id] })
    queryClient.invalidateQueries({ queryKey: ['invitation', invitation.id] })
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        max_guests: form.max_guests,
        is_allowed: form.is_allowed,
        notes: form.notes || null,
      }
      if (editing) {
        await api.put(`/invitations/${invitation.id}/guests/${editing.id}`, payload)
      } else {
        await api.post(`/invitations/${invitation.id}/guests`, payload)
      }
    },
    onSuccess: () => {
      invalidate()
      setEditing(null)
      setCreating(false)
      toast({ title: editing ? 'Guest saved' : 'Guest added', tone: 'success' })
    },
    onError: (error) => {
      toast({ title: 'Could not save the guest', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const remove = useMutation({
    mutationFn: async (guest: InvitationGuest) => {
      await api.delete(`/invitations/${invitation.id}/guests/${guest.id}`)
    },
    onSuccess: () => {
      invalidate()
      setDeleting(null)
      toast({ title: 'Guest removed', tone: 'success' })
    },
    onError: (error) => {
      setDeleting(null)
      toast({ title: 'Could not remove the guest', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const toggleAllowed = useMutation({
    mutationFn: async (guest: InvitationGuest) => {
      await api.put(`/invitations/${invitation.id}/guests/${guest.id}`, { is_allowed: !guest.is_allowed })
    },
    onSuccess: () => invalidate(),
    onError: (error) => {
      toast({ title: 'Could not update the guest', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const openEditor = (guest: InvitationGuest | null) => {
    setEditing(guest)
    setCreating(!guest)
    setForm(
      guest
        ? {
            name: guest.name,
            email: guest.email ?? '',
            phone: guest.phone ?? '',
            max_guests: guest.max_guests,
            is_allowed: guest.is_allowed,
            notes: guest.notes ?? '',
          }
        : emptyForm,
    )
  }

  const copyLink = async (guest: InvitationGuest) => {
    const link = `${invitationPublicUrl(invitation.slug)}?guest=${encodeURIComponent(guest.code)}`
    const copied = await copyToClipboard(link)
    toast({
      title: copied ? 'Personal link copied' : 'Could not copy the link',
      description: copied ? `Send it to ${guest.name}.` : 'Your browser blocked clipboard access.',
      tone: copied ? 'success' : 'error',
    })
  }

  const drawerOpen = Boolean(editing || creating)
  const allowedCount = (query.data ?? []).filter((guest) => guest.is_allowed).length

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl leading-none">The guest list</h2>
          <p className="mt-1 text-xs text-ink/40">
            {(query.data ?? []).length} guest{(query.data ?? []).length === 1 ? '' : 's'} · {allowedCount} active ·
            personal codes for a private RSVP
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search guests or codes"
              className="pl-10 sm:w-60"
              aria-label="Search guests"
            />
          </div>
          <Button type="button" onClick={() => openEditor(null)} icon={<Plus className="h-3.5 w-3.5" />}>
            Add guest
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <PageLoader label="Opening the guest list" />
      ) : query.isError ? (
        <EmptyState
          title="The guest list could not be loaded"
          description={getApiErrorMessage(query.error)}
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
        />
      ) : guests.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title={search ? 'No guests match that search' : 'A private list, if you need one'}
          description={
            search
              ? 'Try a different name, email or code.'
              : 'Add guests to create personal invitation codes. Each code can be shared as a link and can limit the number of seats.'
          }
          action={
            !search ? (
              <Button type="button" onClick={() => openEditor(null)} icon={<Plus className="h-3.5 w-3.5" />}>
                Add the first guest
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink/10 bg-cream/70">
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[46rem]">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Code</th>
                  <th>Seats</th>
                  <th>Status</th>
                  <th>Reply</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id}>
                    <td>
                      <p className="font-medium text-ink">{guest.name}</p>
                      <p className="mt-0.5 text-xs text-ink/40">{guest.email ?? guest.phone ?? 'No contact details'}</p>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => copyLink(guest)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-ink/10 bg-paper px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-ink/60 transition hover:border-gold hover:text-wine"
                        title="Copy personal invitation link"
                      >
                        {guest.code} <Copy className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="text-xs text-ink/55">{guest.max_guests}</td>
                    <td>
                      <button type="button" onClick={() => toggleAllowed.mutate(guest)} disabled={toggleAllowed.isPending}>
                        {guest.is_allowed ? (
                          <Badge tone="green">
                            <UserCheck className="h-3 w-3" /> Active
                          </Badge>
                        ) : (
                          <Badge tone="neutral">
                            <UserX className="h-3 w-3" /> Disabled
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td>
                      {guest.rsvp_submission_id ? (
                        <Badge tone="gold">Replied</Badge>
                      ) : (
                        <span className="text-xs text-ink/35">Waiting</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => copyLink(guest)}
                          aria-label={`Copy link for ${guest.name}`}
                        >
                          <Link2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => openEditor(guest)}
                          aria-label={`Edit ${guest.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon hover:text-[#9b3434]"
                          onClick={() => setDeleting(guest)}
                          aria-label={`Remove ${guest.name}`}
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
        </div>
      )}

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/[0.06] p-4">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="text-xs leading-relaxed text-ink/50">
          Personal codes only matter when <span className="font-medium text-ink/70">Require a guest code</span> is enabled
          in the RSVP tab. Guests can also enter the code directly on the invitation, or arrive through a link like{' '}
          <code className="text-ink/70">?guest={guests[0]?.code ?? 'CODE'}</code>.
        </p>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setEditing(null)
          setCreating(false)
        }}
        title={editing ? `Edit ${editing.name}` : 'Add a guest'}
        description="Personal codes are generated automatically. Add contact details and the number of seats."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(null)
                setCreating(false)
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => save.mutate()} isLoading={save.isPending} disabled={!form.name.trim()}>
              {editing ? 'Save guest' : 'Add guest'}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required className="sm:col-span-2">
            <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </Field>
          <Field label="Seats" hint="Including the guest themselves.">
            <Input
              type="number"
              min={1}
              max={50}
              value={form.max_guests}
              onChange={(event) => setForm((current) => ({ ...current, max_guests: Number(event.target.value) }))}
            />
          </Field>
          <div className="rounded-xl border border-ink/10 bg-paper/60 p-4">
            <Switch
              checked={form.is_allowed}
              onChange={(value) => setForm((current) => ({ ...current, is_allowed: value }))}
              label="Allow this guest to reply"
              hint="Disable to keep the code inactive."
            />
          </div>
          <Field label="Private notes" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Only visible to the studio team."
            />
          </Field>
          {editing ? (
            <div className={cn('rounded-xl border border-ink/10 bg-paper/60 p-4 sm:col-span-2')}>
              <p className="admin-label">Personal invitation link</p>
              <button
                type="button"
                onClick={() => copyLink(editing)}
                className="mt-1 inline-flex items-center gap-2 break-all text-left text-xs text-wine hover:underline"
              >
                {invitationPublicUrl(invitation.slug)}?guest={editing.code} <Copy className="h-3.5 w-3.5 shrink-0" />
              </button>
            </div>
          ) : null}
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
        isLoading={remove.isPending}
        title="Remove this guest?"
        description={`“${deleting?.name ?? 'This guest'}” and their personal code will be removed. Existing RSVP replies are kept.`}
        confirmLabel="Remove guest"
      />
    </div>
  )
}
