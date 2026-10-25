import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, CalendarDays, Clock, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { api, getApiErrorMessage } from '@/lib/api'
import { TIMEZONES } from '@/lib/constants'
import { assetUrl, utcToZonedInput } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { Badge, EmptyState } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { ImageField } from '@/components/media/ImageField'
import type { Invitation, InvitationEvent, MediaRef } from '@/types'

interface EventsTabProps {
  invitation: Invitation
}

interface EventForm {
  title: string
  description: string
  event_at: string
  timezone: string
  venue_name: string
  venue_address: string
  map_url: string
  dress_code: string
  image: MediaRef | null
  rsvp_enabled: boolean
}

function initialEventForm(event: InvitationEvent | null, invitation: Invitation): EventForm {
  return {
    title: event?.title ?? '',
    description: event?.description ?? '',
    event_at: event?.event_at_local ?? (event?.event_at ? utcToZonedInput(event.event_at, event.timezone) : ''),
    timezone: event?.timezone ?? invitation.timezone,
    venue_name: event?.venue_name ?? '',
    venue_address: event?.venue_address ?? '',
    map_url: event?.map_url ?? '',
    dress_code: event?.dress_code ?? '',
    image: event?.image
      ? {
          mediaId: event.image.id,
          url: event.image.url,
          alt: event.image.alt_text,
          width: event.image.width,
          height: event.image.height,
        }
      : null,
    rsvp_enabled: event?.rsvp_enabled ?? true,
  }
}

export function EventsTab({ invitation }: EventsTabProps) {
  const [editing, setEditing] = useState<InvitationEvent | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<InvitationEvent | null>(null)
  const [form, setForm] = useState<EventForm>(() => initialEventForm(null, invitation))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const events = [...invitation.events].sort((a, b) => a.sort_order - b.sort_order)

  useEffect(() => {
    if (!editing && !creating) return
    setForm(initialEventForm(editing, invitation))
    setErrors({})
  }, [editing, creating, invitation])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invitation', invitation.id] })
    queryClient.invalidateQueries({ queryKey: ['invitations'] })
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        event_at: form.event_at || null,
        timezone: form.timezone,
        venue_name: form.venue_name || null,
        venue_address: form.venue_address || null,
        map_url: form.map_url || null,
        dress_code: form.dress_code || null,
        image_media_id: form.image?.mediaId ?? null,
        rsvp_enabled: form.rsvp_enabled,
        sort_order: editing?.sort_order ?? events.length,
      }
      if (editing) {
        await api.put(`/invitations/${invitation.id}/events/${editing.id}`, payload)
      } else {
        await api.post(`/invitations/${invitation.id}/events`, payload)
      }
    },
    onSuccess: () => {
      invalidate()
      setEditing(null)
      setCreating(false)
      toast({ title: editing ? 'Event saved' : 'Event added', tone: 'success' })
    },
    onError: (error) => {
      toast({ title: 'Could not save the event', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const remove = useMutation({
    mutationFn: async (event: InvitationEvent) => {
      await api.delete(`/invitations/${invitation.id}/events/${event.id}`)
    },
    onSuccess: () => {
      invalidate()
      setDeleting(null)
      toast({ title: 'Event removed', tone: 'success' })
    },
    onError: (error) => {
      setDeleting(null)
      toast({ title: 'Could not remove the event', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const reorder = useMutation({
    mutationFn: async ({ event, direction }: { event: InvitationEvent; direction: -1 | 1 }) => {
      const index = events.findIndex((item) => item.id === event.id)
      const swap = events[index + direction]
      if (!swap) return
      await Promise.all([
        api.put(`/invitations/${invitation.id}/events/${event.id}`, { sort_order: swap.sort_order }),
        api.put(`/invitations/${invitation.id}/events/${swap.id}`, { sort_order: event.sort_order }),
      ])
    },
    onSuccess: () => {
      invalidate()
    },
    onError: (error) => {
      toast({ title: 'Could not reorder events', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const update = <K extends keyof EventForm>(key: K, value: EventForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const openEditor = (event: InvitationEvent | null) => {
    setEditing(event)
    setCreating(!event)
    setForm(initialEventForm(event, invitation))
    setErrors({})
  }

  const drawerOpen = Boolean(editing || creating)

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl leading-none">The celebrations</h2>
          <p className="mt-1 text-xs text-ink/40">
            {events.length} event{events.length === 1 ? '' : 's'} · shown in the order below
          </p>
        </div>
        <Button type="button" onClick={() => openEditor(null)} icon={<Plus className="h-3.5 w-3.5" />}>
          Add event
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title="No ceremonies yet"
          description="Add a Mehndi, Nikah, Baraat, Walima or any other moment. Each event can have its own venue, dress code and directions."
          action={
            <Button type="button" onClick={() => openEditor(null)} icon={<Plus className="h-3.5 w-3.5" />}>
              Add the first event
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => {
            const image = assetUrl(event.image?.url)
            return (
              <article key={event.id} className="flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-cream/80 sm:flex-row">
                {image ? (
                  <div className="h-36 w-full shrink-0 sm:h-auto sm:w-44">
                    <img src={image} alt={event.image?.alt_text ?? event.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-24 w-full shrink-0 items-center justify-center bg-gold/10 text-gold sm:h-auto sm:w-44">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-2xl leading-tight text-ink">{event.title}</h3>
                        <Badge tone={event.rsvp_enabled ? 'green' : 'neutral'}>
                          {event.rsvp_enabled ? 'RSVP open' : 'No RSVP'}
                        </Badge>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.62rem] uppercase tracking-[0.14em] text-ink/45">
                        {event.date ? (
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3 w-3 text-gold" /> {event.date.formatted}
                          </span>
                        ) : (
                          <span>Date to be announced</span>
                        )}
                        {event.date ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-gold" /> {event.date.time_formatted}
                          </span>
                        ) : null}
                        {event.venue_name ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-gold" /> {event.venue_name}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => reorder.mutate({ event, direction: -1 })}
                        disabled={index === 0 || reorder.isPending}
                        aria-label="Move event earlier"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => reorder.mutate({ event, direction: 1 })}
                        disabled={index === events.length - 1 || reorder.isPending}
                        aria-label="Move event later"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button type="button" className="btn-icon" onClick={() => openEditor(event)} aria-label="Edit event">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-icon hover:text-[#9b3434]"
                        onClick={() => setDeleting(event)}
                        aria-label="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {event.description ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink/50">{event.description}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-ink/[0.07] pt-3 text-[0.6rem] uppercase tracking-[0.14em] text-ink/40">
                    {event.dress_code ? <span>Dress · {event.dress_code}</span> : null}
                    {event.venue_address ? <span className="truncate">{event.venue_address}</span> : null}
                    {event.rsvp_enabled ? (
                      <span className="inline-flex items-center gap-1 text-[#3f6b4b]">
                        <Users className="h-3 w-3" /> RSVP enabled
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setEditing(null)
          setCreating(false)
        }}
        title={editing ? `Edit ${editing.title}` : 'Add an event'}
        description="Each ceremony can have its own date, venue, dress code and photograph."
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
            <Button
              type="button"
              onClick={() => save.mutate()}
              isLoading={save.isPending}
              disabled={!form.title.trim()}
            >
              {editing ? 'Save event' : 'Add event'}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Event name" required error={errors.title} className="sm:col-span-2">
            <Input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Nikah" />
          </Field>
          <Field label="Date & time">
            <Input type="datetime-local" value={form.event_at} onChange={(event) => update('event_at', event.target.value)} />
          </Field>
          <Field label="Timezone">
            <Select value={form.timezone} onChange={(event) => update('timezone', event.target.value)}>
              {TIMEZONES.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="A sentence or two about the ceremony."
            />
          </Field>
          <Field label="Venue name">
            <Input value={form.venue_name} onChange={(event) => update('venue_name', event.target.value)} />
          </Field>
          <Field label="Venue address">
            <Input value={form.venue_address} onChange={(event) => update('venue_address', event.target.value)} />
          </Field>
          <Field label="Google Maps URL" hint="A directions link for guests.">
            <Input value={form.map_url} onChange={(event) => update('map_url', event.target.value)} placeholder="https://" />
          </Field>
          <Field label="Dress code">
            <Input value={form.dress_code} onChange={(event) => update('dress_code', event.target.value)} placeholder="Formal Eastern" />
          </Field>
          <ImageField
            label="Event photograph"
            aspect="wide"
            value={form.image}
            onChange={(value) => update('image', value)}
            className="sm:col-span-2"
          />
          <div className="rounded-xl border border-ink/10 bg-paper/60 p-4 sm:col-span-2">
            <Switch
              checked={form.rsvp_enabled}
              onChange={(value) => update('rsvp_enabled', value)}
              label="Include this event in RSVP details"
              hint="Guests see the event listed with the celebration."
            />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
        isLoading={remove.isPending}
        title="Remove this event?"
        description={`“${deleting?.title ?? 'This event'}” will be removed from the invitation. Guests will no longer see it.`}
        confirmLabel="Remove event"
      />
    </div>
  )
}
