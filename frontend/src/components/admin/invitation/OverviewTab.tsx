import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ExternalLink, MapPin, Save, UserRound } from 'lucide-react'
import { api, getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { TIMEZONES } from '@/lib/constants'
import { utcToZonedInput } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import type { Invitation, Theme } from '@/types'

interface OverviewForm {
  title: string
  slug: string
  theme_id: number
  partner_one: string
  partner_two: string
  title_line: string
  subtitle: string
  hashtag: string
  quote: string
  message: string
  families: string
  story_heading: string
  story_body: string
  event_at: string
  timezone: string
  venue_name: string
  venue_address: string
  venue_map_url: string
  venue_map_embed: string
}

function initialForm(invitation: Invitation): OverviewForm {
  return {
    title: invitation.title,
    slug: invitation.slug,
    theme_id: invitation.theme_id ?? invitation.theme?.id ?? 0,
    partner_one: invitation.couple_details.partner_one ?? '',
    partner_two: invitation.couple_details.partner_two ?? '',
    title_line: invitation.couple_details.title ?? '',
    subtitle: invitation.couple_details.subtitle ?? '',
    hashtag: invitation.couple_details.hashtag ?? '',
    quote: invitation.couple_details.quote ?? '',
    message: invitation.couple_details.message ?? '',
    families: invitation.couple_details.families ?? '',
    story_heading: invitation.couple_details.story_heading ?? '',
    story_body: invitation.couple_details.story_body ?? '',
    event_at: invitation.event_at_local ?? utcToZonedInput(invitation.event_at, invitation.timezone),
    timezone: invitation.timezone,
    venue_name: invitation.venue_name ?? '',
    venue_address: invitation.venue_address ?? '',
    venue_map_url: invitation.venue_map_url ?? '',
    venue_map_embed: invitation.venue_map_embed ?? '',
  }
}

export function OverviewTab({ invitation, themes }: { invitation: Invitation; themes: Theme[] }) {
  const [form, setForm] = useState<OverviewForm>(() => initialForm(invitation))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    setForm(initialForm(invitation))
    setErrors({})
  }, [invitation.id, invitation.updated_at])

  const update = <K extends keyof OverviewForm>(key: K, value: OverviewForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/invitations/${invitation.id}`, {
        title: form.title,
        slug: form.slug,
        theme_id: form.theme_id,
        timezone: form.timezone,
        event_at: form.event_at || null,
        venue_name: form.venue_name || null,
        venue_address: form.venue_address || null,
        venue_map_url: form.venue_map_url || null,
        venue_map_embed: form.venue_map_embed || null,
        couple_details: {
          ...invitation.couple_details,
          partner_one: form.partner_one,
          partner_two: form.partner_two,
          title: form.title_line || null,
          subtitle: form.subtitle || null,
          hashtag: form.hashtag || null,
          quote: form.quote || null,
          message: form.message || null,
          families: form.families || null,
          story_heading: form.story_heading || null,
          story_body: form.story_body || null,
        },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitation', invitation.id] })
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast({ title: 'Invitation saved', description: 'Your latest details are live in the studio.', tone: 'success' })
    },
    onError: (error) => {
      const fieldErrors = getApiFieldErrors(error)
      const mapped: Record<string, string> = {}
      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (field === 'couple_details.partner_one') mapped.partner_one = message
        else if (field === 'couple_details.partner_two') mapped.partner_two = message
        else if (field.startsWith('couple_details.')) mapped[field.replace('couple_details.', '')] = message
        else mapped[field] = message
      })
      setErrors(mapped)
      toast({ title: 'Could not save', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!form.title.trim()) nextErrors.title = 'Give the invitation a title.'
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) nextErrors.slug = 'Use lowercase letters, numbers and hyphens.'
    if (!form.partner_one.trim()) nextErrors.partner_one = 'Add the first name.'
    if (!form.partner_two.trim()) nextErrors.partner_two = 'Add the second name.'
    if (!form.theme_id) nextErrors.theme_id = 'Choose a theme.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) mutation.mutate()
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <section className="admin-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <UserRound className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="font-display text-2xl leading-none">The couple</h2>
            <p className="mt-1 text-xs text-ink/40">Names, family lines and the words that introduce you.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Invitation title" required error={errors.title}>
            <Input value={form.title} onChange={(event) => update('title', event.target.value)} />
          </Field>
          <Field label="Public URL" required error={errors.slug}>
            <div className="flex items-center">
              <span className="shrink-0 rounded-l-lg border border-r-0 border-ink/15 bg-paper px-3 py-2.5 text-xs text-ink/40">/i/</span>
              <Input className="rounded-l-none" value={form.slug} onChange={(event) => update('slug', event.target.value)} />
            </div>
          </Field>
          <Field label="First partner" required error={errors.partner_one}>
            <Input value={form.partner_one} onChange={(event) => update('partner_one', event.target.value)} />
          </Field>
          <Field label="Second partner" required error={errors.partner_two}>
            <Input value={form.partner_two} onChange={(event) => update('partner_two', event.target.value)} />
          </Field>
          <Field label="Opening line" hint="The small line above your names." className="sm:col-span-2">
            <Input
              value={form.title_line}
              onChange={(event) => update('title_line', event.target.value)}
              placeholder="Together with their families"
            />
          </Field>
          <Field label="Subtitle" className="sm:col-span-2">
            <Input
              value={form.subtitle}
              onChange={(event) => update('subtitle', event.target.value)}
              placeholder="request the pleasure of your company"
            />
          </Field>
          <Field label="Hashtag">
            <Input value={form.hashtag} onChange={(event) => update('hashtag', event.target.value)} placeholder="#MaheenAndUzair" />
          </Field>
          <Field label="Families" hint="A graceful line for both families.">
            <Input value={form.families} onChange={(event) => update('families', event.target.value)} />
          </Field>
          <Field label="A short quote" className="sm:col-span-2">
            <Input value={form.quote} onChange={(event) => update('quote', event.target.value)} />
          </Field>
          <Field label="Welcome message" className="sm:col-span-2">
            <Textarea
              value={form.message}
              onChange={(event) => update('message', event.target.value)}
              placeholder="A few words to welcome your guests."
            />
          </Field>
          <Field label="Story heading">
            <Input value={form.story_heading} onChange={(event) => update('story_heading', event.target.value)} />
          </Field>
          <Field label="Theme" error={errors.theme_id}>
            <Select value={form.theme_id} onChange={(event) => update('theme_id', Number(event.target.value))}>
              <option value={0}>Choose a theme</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="The full story" className="sm:col-span-2" hint="Separate paragraphs with a blank line.">
            <Textarea
              className="min-h-40"
              value={form.story_body}
              onChange={(event) => update('story_body', event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="admin-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <CalendarDays className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="font-display text-2xl leading-none">The wedding</h2>
            <p className="mt-1 text-xs text-ink/40">The central date used for the countdown and main celebration.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </section>

      <section className="admin-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="font-display text-2xl leading-none">The venue</h2>
            <p className="mt-1 text-xs text-ink/40">Used in the hero, venue section and event directions.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Venue name">
            <Input value={form.venue_name} onChange={(event) => update('venue_name', event.target.value)} />
          </Field>
          <Field label="Address">
            <Input value={form.venue_address} onChange={(event) => update('venue_address', event.target.value)} />
          </Field>
          <Field label="Google Maps URL" hint="A link guests can open for directions.">
            <Input value={form.venue_map_url} onChange={(event) => update('venue_map_url', event.target.value)} />
          </Field>
          <Field label="Map embed" hint="Optional — paste an iframe embed from Google Maps.">
            <Input value={form.venue_map_embed} onChange={(event) => update('venue_map_embed', event.target.value)} />
          </Field>
        </div>

        {invitation.status === 'published' ? (
          <a
            href={`/i/${invitation.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold hover:text-ink"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View the live invitation
          </a>
        ) : null}
      </section>

      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-cream/95 px-4 py-3 shadow-lift backdrop-blur">
        <p className="text-xs text-ink/40">
          {invitation.updated_at ? `Last saved ${new Date(invitation.updated_at).toLocaleString()}` : 'Not saved yet'}
        </p>
        <Button type="submit" isLoading={mutation.isPending} icon={<Save className="h-3.5 w-3.5" />}>
          Save details
        </Button>
      </div>
    </form>
  )
}
