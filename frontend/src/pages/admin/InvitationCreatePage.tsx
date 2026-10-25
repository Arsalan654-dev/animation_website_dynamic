import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, CalendarDays, Check, MapPin, Sparkles, Wand2 } from 'lucide-react'
import { api, getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { slugify, cn } from '@/lib/utils'
import { TIMEZONES } from '@/lib/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { invitationCreateSchema, type InvitationCreateValues } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { PageHeader, PageLoader } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { themeCssVars } from '@/lib/theme'
import type { ApiEnvelope, Invitation, Template, Theme } from '@/types'

function defaultEventDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() + 6)
  date.setDate(Math.min(12, 28))
  date.setHours(18, 0, 0, 0)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function InvitationCreatePage() {
  useDocumentTitle('New invitation — Ever After Studio')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const lastAutoTitle = useRef('')
  const slugLocked = useRef(false)

  const themesQuery = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Theme[] }>('/themes')
      return data.data
    },
  })

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Template[] }>('/templates')
      return data.data
    },
  })

  const themes = themesQuery.data ?? []
  const templates = templatesQuery.data ?? []

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InvitationCreateValues>({
    resolver: zodResolver(invitationCreateSchema),
    defaultValues: {
      title: '',
      partner_one: '',
      partner_two: '',
      slug: '',
      theme_id: 0,
      template_id: null,
      event_at: defaultEventDate(),
      timezone: 'Asia/Karachi',
      venue_name: '',
    },
  })

  const partnerOne = watch('partner_one')
  const partnerTwo = watch('partner_two')
  const title = watch('title')
  const themeId = watch('theme_id')
  const templateId = watch('template_id')

  useEffect(() => {
    if (themes.length && !themeId) {
      setValue('theme_id', themes[0].id, { shouldValidate: true })
    }
  }, [themes, themeId, setValue])

  useEffect(() => {
    if (!partnerOne && !partnerTwo) return
    const autoTitle = [partnerOne, partnerTwo].filter(Boolean).join(' & ')
    if (!title || title === lastAutoTitle.current) {
      lastAutoTitle.current = autoTitle
      setValue('title', autoTitle, { shouldValidate: Boolean(autoTitle) })
    }
    if (!slugLocked.current) {
      setValue('slug', slugify(`${partnerOne || 'partner'}-and-${partnerTwo || 'partner'}`), {
        shouldValidate: Boolean(partnerOne && partnerTwo),
      })
    }
  }, [partnerOne, partnerTwo, title, setValue])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? null,
    [templates, templateId],
  )

  const mutation = useMutation({
    mutationFn: async (values: InvitationCreateValues) => {
      const { data } = await api.post<ApiEnvelope<Invitation>>('/invitations', {
        ...values,
        template_id: values.template_id || null,
        venue_name: values.venue_name || null,
        couple_details: {
          partner_one: values.partner_one,
          partner_two: values.partner_two,
        },
        apply_template_sections: Boolean(values.template_id),
      })
      return data.data
    },
    onSuccess: (invitation) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Invitation created', description: 'Now shape the story and design.', tone: 'success' })
      navigate(`/admin/invitations/${invitation.id}/edit`, { replace: true })
    },
    onError: (error) => {
      const fieldErrors = getApiFieldErrors(error)
      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (
          field === 'title' ||
          field === 'slug' ||
          field === 'theme_id' ||
          field === 'event_at' ||
          field === 'timezone' ||
          field === 'couple_details.partner_one' ||
          field === 'couple_details.partner_two'
        ) {
          setError(field as keyof InvitationCreateValues, { message })
        }
      })
      toast({ title: 'Could not create the invitation', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  if (themesQuery.isLoading) return <PageLoader label="Laying out the atelier" />

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  return (
    <div>
      <Link to="/admin/invitations" className="mb-5 inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/40 transition hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to invitations
      </Link>

      <PageHeader
        eyebrow="A new beginning"
        title={
          <>
            Start a new
            <span className="block italic text-wine">invitation.</span>
          </>
        }
        description="Choose the couple, the theme and the celebration date. Everything can be refined later in the studio."
      />

      <form onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-12" noValidate>
        <div className="space-y-5 xl:col-span-8">
          <section className="admin-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div>
                <h2 className="font-display text-2xl leading-none">The couple</h2>
                <p className="mt-1 text-xs text-ink/40">The names that anchor the whole invitation.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First partner" required error={errors.partner_one?.message}>
                <Input placeholder="Maheen" {...register('partner_one')} />
              </Field>
              <Field label="Second partner" required error={errors.partner_two?.message}>
                <Input placeholder="Uzair" {...register('partner_two')} />
              </Field>
              <Field
                label="Invitation title"
                required
                error={errors.title?.message}
                hint="Shown in the studio and browser title."
                className="sm:col-span-2"
              >
                <Input placeholder="Maheen & Uzair" {...register('title')} />
              </Field>
              <Field
                label="Public URL"
                required
                error={errors.slug?.message}
                hint="everafter.studio/i/your-slug"
                className="sm:col-span-2"
              >
                <div className="flex items-center">
                  <span className="shrink-0 rounded-l-lg border border-r-0 border-ink/15 bg-paper px-3 py-2.5 text-xs text-ink/40">
                    /i/
                  </span>
                  <Input
                    className="rounded-l-none"
                    placeholder="maheen-and-uzair"
                    {...register('slug', {
                      onChange: () => {
                        slugLocked.current = true
                      },
                    })}
                  />
                </div>
              </Field>
            </div>
          </section>

          <section className="admin-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                <CalendarDays className="h-3.5 w-3.5" />
              </span>
              <div>
                <h2 className="font-display text-2xl leading-none">The celebration</h2>
                <p className="mt-1 text-xs text-ink/40">You can add individual events and ceremonies next.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Wedding date & time" required error={errors.event_at?.message}>
                <Input type="datetime-local" {...register('event_at')} />
              </Field>
              <Field label="Timezone" required error={errors.timezone?.message}>
                <Select {...register('timezone')}>
                  {TIMEZONES.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone.replace('_', ' ')}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Venue name" error={errors.venue_name?.message} hint="Optional — add the address in the editor." className="sm:col-span-2">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
                  <Input className="pl-10" placeholder="The Marquee, Ocean Mall" {...register('venue_name')} />
                </div>
              </Field>
            </div>
          </section>
        </div>

        <div className="space-y-5 xl:col-span-4">
          <section className="admin-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl leading-none">Theme</h2>
                <p className="mt-1 text-xs text-ink/40">The visual world of the invitation.</p>
              </div>
              {errors.theme_id ? <span className="text-xs text-[#9b3434]">{errors.theme_id.message}</span> : null}
            </div>

            <Controller
              control={control}
              name="theme_id"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {themes.map((theme) => {
                    const active = field.value === theme.id
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => field.onChange(theme.id)}
                        className={cn(
                          'relative overflow-hidden rounded-xl border text-left transition',
                          active ? 'border-gold ring-2 ring-gold/30' : 'border-ink/10 hover:border-ink/25',
                        )}
                        style={themeCssVars(theme.tokens)}
                      >
                        <span className="block h-14 w-full" style={{ background: `linear-gradient(135deg, ${theme.tokens.colors.primary}, ${theme.tokens.colors.accent})` }} />
                        <span className="block bg-cream px-2.5 py-2">
                          <span className="block truncate text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-ink/70">
                            {theme.name}
                          </span>
                          <span className="mt-0.5 flex gap-1">
                            {[theme.tokens.colors.primary, theme.tokens.colors.secondary, theme.tokens.colors.accent].map((color) => (
                              <span key={color} className="h-1.5 w-1.5 rounded-full border border-black/10" style={{ background: color }} />
                            ))}
                          </span>
                        </span>
                        {active ? (
                          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-ink">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </section>

          <section className="admin-card p-5">
            <h2 className="font-display text-2xl leading-none">Template</h2>
            <p className="mt-1 text-xs text-ink/40">Optional — begin with a pre-composed section flow.</p>
            <Controller
              control={control}
              name="template_id"
              render={({ field }) => (
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => field.onChange(null)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition',
                      !field.value ? 'border-gold bg-gold/[0.08] text-ink' : 'border-ink/10 text-ink/55 hover:border-ink/25',
                    )}
                  >
                    <Wand2 className="h-3.5 w-3.5 text-gold" />
                    Start from a blank page
                  </button>
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => field.onChange(template.id)}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2.5 text-left text-xs transition',
                        field.value === template.id
                          ? 'border-gold bg-gold/[0.08] text-ink'
                          : 'border-ink/10 text-ink/55 hover:border-ink/25',
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-[0.55rem] uppercase tracking-[0.12em] text-ink/30">{template.category}</span>
                      </span>
                      <span className="mt-0.5 block text-[0.6rem] leading-relaxed text-ink/35">
                        {template.description ?? 'A pre-composed invitation flow'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            />
            {selectedTemplate ? (
              <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-[0.62rem] leading-relaxed text-ink/45">
                Its sections will be copied into your new invitation, ready to edit.
              </p>
            ) : null}
          </section>

          <div className="rounded-2xl border border-wine/15 bg-wine p-5 text-cream">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-gold">Ready when you are</p>
            <p className="mt-2 text-xs leading-relaxed text-cream/55">
              The invitation is created as a private draft. You can preview every change before it reaches a guest.
            </p>
            <Button type="submit" variant="gold" className="mt-4 w-full" isLoading={isSubmitting}>
              Create the draft <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
