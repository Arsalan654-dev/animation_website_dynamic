import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Brush, Check, Image as ImageIcon, MailOpen, Save, Sparkles, Wand2 } from 'lucide-react'
import { api, getApiErrorMessage, getApiFieldErrors } from '@/lib/api'
import { mergeThemeTokens } from '@/lib/theme'
import { assetUrl, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Switch } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { ImageField } from '@/components/media/ImageField'
import { ThemeTokenEditor } from '@/components/admin/theme/ThemeTokenEditor'
import { ThemePreview } from '@/components/admin/theme/ThemePreview'
import type { AnimationConfig, AnimationPreset, DesignConfig, EnvelopeConfig, Invitation, MediaRef, Theme, ThemeTokens } from '@/types'

interface DesignTabProps {
  invitation: Invitation
  themes: Theme[]
  presets: AnimationPreset[]
}

interface DesignForm {
  themeId: number
  tokens: ThemeTokens
  envelope: EnvelopeConfig
  cover: MediaRef | null
  animationPreset: string
  animationDisabled: boolean
  overrides: AnimationConfig
}

function initialForm(invitation: Invitation, themes: Theme[]): DesignForm {
  const theme = themes.find((item) => item.id === invitation.theme_id) ?? invitation.theme ?? themes[0] ?? null
  const base = theme?.tokens ?? mergeThemeTokens(defaultTokensFallback(), null)
  const overrides = invitation.design_config?.theme_tokens ?? {}
  const envelope = invitation.envelope ?? ({} as EnvelopeConfig)

  return {
    themeId: invitation.theme_id ?? theme?.id ?? 0,
    tokens: mergeThemeTokens(base, overrides),
    envelope: {
      enabled: envelope.enabled ?? true,
      style: envelope.style ?? 'classic',
      monogram: envelope.monogram ?? '',
      seal_text: envelope.seal_text ?? '',
      prompt: envelope.prompt ?? 'Open the invitation',
      cover_media_id: envelope.cover_media_id ?? null,
      card_media_id: envelope.card_media_id ?? null,
      seal_media_id: envelope.seal_media_id ?? null,
      card_message: envelope.card_message ?? '',
      cover_image: envelope.cover_image ?? null,
      card_image: envelope.card_image ?? null,
      seal_image: envelope.seal_image ?? null,
    },
    cover: invitation.cover_image_path
      ? { url: invitation.cover_image_path, alt: `${invitation.title} cover` }
      : null,
    animationPreset: invitation.design_config?.animation?.preset ?? '',
    animationDisabled: Boolean(invitation.design_config?.animation?.disabled),
    overrides: invitation.design_config?.animation?.overrides ?? {},
  }
}

function defaultTokensFallback(): ThemeTokens {
  return {
    colors: {
      primary: '#4a1f2c',
      secondary: '#6d6b4e',
      accent: '#b99358',
      surface: '#f7f1e6',
      surfaceAlt: '#efe5d5',
      text: '#2c211b',
      muted: '#6f6154',
      line: 'rgba(74, 31, 44, 0.18)',
      onPrimary: '#fffaf2',
    },
    typography: {
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Jost',
      scriptFont: 'Great Vibes',
      baseSize: 16,
      headingWeight: 500,
      bodyWeight: 400,
      headingScale: 1.5,
      bodyLineHeight: 1.75,
      letterSpacing: 0.02,
    },
    surfaces: {
      pageBackground: '#f7f1e6',
      cardBackground: 'rgba(255, 251, 244, 0.72)',
      cardBorder: 'rgba(74, 31, 44, 0.16)',
      cardRadius: 4,
      paperTexture: 'grain',
      paperTextureOpacity: 0.32,
      shadow: 'soft',
      sectionSpacing: 96,
      contentWidth: 1160,
    },
    buttons: { radius: 999, style: 'outline', letterSpacing: 0.14, textTransform: 'uppercase' },
    ornaments: { divider: 'botanical', corner: 'branch', overlayMediaId: null },
    layout: { imageAspect: '4/5', gallery: 'masonry', align: 'center' },
    animation: { preset: 'fade-up', disabled: false },
  }
}

function envelopeRef(form: DesignForm, slot: 'cover' | 'card' | 'seal'): MediaRef | null {
  return form.envelope[`${slot}_image` as 'cover_image' | 'card_image' | 'seal_image'] ?? null
}

export function DesignTab({ invitation, themes, presets }: DesignTabProps) {
  const [form, setForm] = useState<DesignForm>(() => initialForm(invitation, themes))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    setForm(initialForm(invitation, themes))
    setErrors({})
  }, [invitation.id, invitation.updated_at, themes])

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === form.themeId) ?? null,
    [themes, form.themeId],
  )

  const chooseTheme = (theme: Theme) => {
    setForm((current) => ({
      ...current,
      themeId: theme.id,
      tokens: theme.tokens,
      animationPreset: current.animationPreset || theme.default_animation_preset?.slug || '',
    }))
  }

  const setEnvelope = <K extends keyof EnvelopeConfig>(key: K, value: EnvelopeConfig[K]) =>
    setForm((current) => ({ ...current, envelope: { ...current.envelope, [key]: value } }))

  const setEnvelopeImage = (slot: 'cover' | 'card' | 'seal', value: MediaRef | null) => {
    setForm((current) => ({
      ...current,
      envelope: {
        ...current.envelope,
        [`${slot}_media_id`]: value?.mediaId ?? null,
        [`${slot}_image`]: value,
      },
    }))
  }

  const setOverride = (key: keyof AnimationConfig, value: number | string | boolean | undefined) =>
    setForm((current) => ({
      ...current,
      overrides: { ...current.overrides, [key]: value },
    }))

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        theme_id: form.themeId,
        cover_image_path: form.cover?.url ?? null,
        envelope: {
          enabled: form.envelope.enabled,
          style: form.envelope.style,
          monogram: form.envelope.monogram || null,
          seal_text: form.envelope.seal_text || null,
          prompt: form.envelope.prompt || null,
          cover_media_id: form.envelope.cover_media_id || null,
          card_media_id: form.envelope.card_media_id || null,
          seal_media_id: form.envelope.seal_media_id || null,
          card_message: form.envelope.card_message || null,
        },
        design_config: {
          theme_tokens: form.tokens,
          animation: {
            preset: form.animationPreset || null,
            disabled: form.animationDisabled,
            overrides: Object.fromEntries(
              Object.entries(form.overrides).filter(([, value]) => value !== undefined && value !== ''),
            ),
          },
        } satisfies DesignConfig,
      }
      const { data } = await api.patch(`/invitations/${invitation.id}`, payload)
      return data.data as Invitation
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['invitation', invitation.id], updated)
      queryClient.invalidateQueries({ queryKey: ['invitation', invitation.id] })
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      toast({ title: 'Design saved', description: 'The new theme is ready to preview.', tone: 'success' })
    },
    onError: (error) => {
      setErrors(getApiFieldErrors(error))
      toast({ title: 'Could not save the design', description: getApiErrorMessage(error), tone: 'error' })
    },
  })

  const previewTokens = mergeThemeTokens(selectedTheme?.tokens ?? defaultTokensFallback(), {
    ...form.tokens,
    animation: { preset: form.animationPreset || null, disabled: form.animationDisabled },
  })

  return (
    <div className="grid gap-5 xl:grid-cols-12">
      <div className="space-y-5 xl:col-span-8">
        <section className="admin-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <Brush className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="font-display text-2xl leading-none">The theme</h2>
              <p className="mt-1 text-xs text-ink/40">Choose the visual world, then refine its tokens.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {themes.map((theme) => {
              const active = form.themeId === theme.id
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => chooseTheme(theme)}
                  className={cn(
                    'relative overflow-hidden rounded-xl border text-left transition',
                    active ? 'border-gold ring-2 ring-gold/30' : 'border-ink/10 hover:border-ink/25',
                  )}
                >
                  <span
                    className="flex h-16 items-end justify-center pb-2"
                    style={{ background: `linear-gradient(135deg, ${theme.tokens.colors.primary}, ${theme.tokens.colors.accent})` }}
                  >
                    <span className="font-display text-sm text-white/90">
                      {theme.name.split(' ')[0]}
                    </span>
                  </span>
                  <span className="block bg-cream px-2.5 py-2">
                    <span className="block truncate text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-ink/70">
                      {theme.name}
                    </span>
                    <span className="mt-1 flex gap-1">
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
          {errors.theme_id ? <p className="mt-2 text-xs text-[#9b3434]">{errors.theme_id}</p> : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            <h3 className="admin-label !mb-0">Refine the theme tokens</h3>
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  tokens: selectedTheme?.tokens ?? defaultTokensFallback(),
                }))
              }
              className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink/40 transition hover:text-wine"
            >
              Reset to theme
            </button>
          </div>
          <div className="mt-4">
            <ThemeTokenEditor
              tokens={form.tokens}
              onChange={(tokens) => setForm((current) => ({ ...current, tokens }))}
            />
          </div>
        </section>

        <section className="admin-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <MailOpen className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="font-display text-2xl leading-none">The envelope</h2>
              <p className="mt-1 text-xs text-ink/40">The first gesture your guests will see.</p>
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-ink/10 bg-paper/60 p-4">
            <Switch
              checked={form.envelope.enabled}
              onChange={(value) => setEnvelope('enabled', value)}
              label="Open with an envelope"
              hint="Guests open a sealed invitation before the site appears."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Envelope style">
              <Select value={form.envelope.style} onChange={(event) => setEnvelope('style', event.target.value)}>
                <option value="classic">Classic</option>
                <option value="wax">Wax seal</option>
                <option value="botanical">Botanical</option>
                <option value="minimal">Minimal</option>
                <option value="gilded">Gilded</option>
              </Select>
            </Field>
            <Field label="Monogram">
              <Input value={form.envelope.monogram} onChange={(event) => setEnvelope('monogram', event.target.value)} placeholder="M & U" />
            </Field>
            <Field label="Seal text">
              <Input value={form.envelope.seal_text} onChange={(event) => setEnvelope('seal_text', event.target.value)} placeholder="M & U" />
            </Field>
            <Field label="Opening prompt">
              <Input value={form.envelope.prompt} onChange={(event) => setEnvelope('prompt', event.target.value)} />
            </Field>
            <Field label="Card message" className="sm:col-span-2">
              <Input value={form.envelope.card_message} onChange={(event) => setEnvelope('card_message', event.target.value)} />
            </Field>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <ImageField
              label="Envelope cover"
              hint="The paper behind the seal."
              aspect="portrait"
              value={envelopeRef(form, 'cover')}
              onChange={(value) => setEnvelopeImage('cover', value)}
            />
            <ImageField
              label="Invitation card"
              hint="Revealed after opening."
              aspect="portrait"
              value={envelopeRef(form, 'card')}
              onChange={(value) => setEnvelopeImage('card', value)}
            />
            <ImageField
              label="Wax seal"
              hint="Optional — a custom seal image."
              aspect="square"
              value={envelopeRef(form, 'seal')}
              onChange={(value) => setEnvelopeImage('seal', value)}
            />
          </div>
        </section>

        <section className="admin-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <ImageIcon className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="font-display text-2xl leading-none">Cover photograph</h2>
              <p className="mt-1 text-xs text-ink/40">Used by the hero when a section has no background of its own.</p>
            </div>
          </div>
          <div className="max-w-sm">
            <ImageField
              label="Cover image"
              aspect="wide"
              value={form.cover}
              onChange={(value) => setForm((current) => ({ ...current, cover: value }))}
            />
          </div>
        </section>

        <section className="admin-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="font-display text-2xl leading-none">Movement</h2>
              <p className="mt-1 text-xs text-ink/40">A single animation language for the whole invitation.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Animation preset">
              <Select
                value={form.animationPreset}
                onChange={(event) => setForm((current) => ({ ...current, animationPreset: event.target.value }))}
              >
                <option value="">Use the theme default</option>
                {presets.map((preset) => (
                  <option key={preset.slug} value={preset.slug}>
                    {preset.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Easing">
              <Select
                value={String(form.overrides.easing ?? 'easeOut')}
                onChange={(event) => setOverride('easing', event.target.value)}
              >
                <option value="easeOut">Ease out</option>
                <option value="easeIn">Ease in</option>
                <option value="easeInOut">Ease in out</option>
                <option value="linear">Linear</option>
                <option value="spring">Spring</option>
              </Select>
            </Field>
            <Field label="Duration" hint="Seconds · 0.1–10">
              <Input
                type="number"
                step={0.1}
                min={0.1}
                max={10}
                value={form.overrides.duration ?? 0.8}
                onChange={(event) => setOverride('duration', Number(event.target.value))}
              />
            </Field>
            <Field label="Distance" hint="Pixels · 0–200">
              <Input
                type="number"
                step={1}
                min={0}
                max={200}
                value={form.overrides.distance ?? 40}
                onChange={(event) => setOverride('distance', Number(event.target.value))}
              />
            </Field>
            <Field label="Stagger" hint="Seconds between items">
              <Input
                type="number"
                step={0.01}
                min={0}
                max={1}
                value={form.overrides.stagger ?? 0.12}
                onChange={(event) => setOverride('stagger', Number(event.target.value))}
              />
            </Field>
            <Field label="Delay" hint="Seconds · 0–5">
              <Input
                type="number"
                step={0.05}
                min={0}
                max={5}
                value={form.overrides.delay ?? 0.05}
                onChange={(event) => setOverride('delay', Number(event.target.value))}
              />
            </Field>
          </div>

          <div className="mt-4 rounded-xl border border-ink/10 bg-paper/60 p-4">
            <Switch
              checked={form.animationDisabled}
              onChange={(value) => setForm((current) => ({ ...current, animationDisabled: value }))}
              label="Pause animations for this invitation"
              hint="Content still appears, simply without movement."
            />
          </div>
        </section>

        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-cream/95 px-4 py-3 shadow-lift backdrop-blur">
          <p className="text-xs text-ink/40">
            {invitation.updated_at ? `Last saved ${new Date(invitation.updated_at).toLocaleString()}` : 'Not saved yet'}
          </p>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            icon={<Save className="h-3.5 w-3.5" />}
          >
            Save design
          </Button>
        </div>
      </div>

      <aside className="xl:col-span-4">
        <div className="sticky top-24 space-y-4">
          <section className="admin-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl leading-none">Live mood</h2>
              <span className="text-[0.55rem] uppercase tracking-[0.18em] text-ink/35">{selectedTheme?.name ?? 'Theme'}</span>
            </div>
            <ThemePreview
              tokens={previewTokens}
              partnerOne={invitation.couple_details.partner_one}
              partnerTwo={invitation.couple_details.partner_two}
              dateLabel={invitation.event?.short_date ?? 'Date to be announced'}
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[previewTokens.colors.primary, previewTokens.colors.secondary, previewTokens.colors.accent, previewTokens.colors.surfaceAlt].map(
                (color) => (
                  <span key={color} className="h-5 w-5 rounded-full border border-black/10" style={{ background: color }} title={color} />
                ),
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gold/20 bg-gold/[0.06] p-4">
            <p className="flex items-center gap-2 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
              <Wand2 className="h-3.5 w-3.5 text-gold" /> A note on tokens
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink/50">
              These refinements apply only to this invitation. The shared theme stays untouched, so you can give every
              celebration its own character without losing the original.
            </p>
          </section>

          {form.envelope.enabled ? (
            <section className="overflow-hidden rounded-2xl border border-ink/10 bg-cream/70">
              <div className="relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden p-5 text-center">
                {assetUrl(form.envelope.cover_image?.url ?? form.cover?.url) ? (
                  <img
                    src={assetUrl(form.envelope.cover_image?.url ?? form.cover?.url) ?? ''}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(150deg, ${previewTokens.colors.primary}, ${previewTokens.colors.secondary})` }}
                  />
                )}
                <div className="absolute inset-0 bg-ink/35" />
                <span
                  className="relative flex h-16 w-16 items-center justify-center rounded-full border text-sm"
                  style={{
                    borderColor: previewTokens.colors.accent,
                    background: previewTokens.colors.primary,
                    color: previewTokens.colors.accent,
                    fontFamily: 'var(--w-heading-font)',
                    boxShadow: '0 12px 30px -12px rgba(0,0,0,0.6)',
                  }}
                >
                  {form.envelope.seal_text || form.envelope.monogram || 'M & U'}
                </span>
                <p
                  className="relative mt-5 text-[0.55rem] uppercase tracking-[0.28em] text-white/75"
                  style={{ fontFamily: 'var(--w-body-font)' }}
                >
                  {form.envelope.prompt || 'Open the invitation'}
                </p>
              </div>
              <p className="border-t border-ink/10 px-4 py-2.5 text-[0.58rem] uppercase tracking-[0.16em] text-ink/35">
                Envelope · {form.envelope.style}
              </p>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  )
}
