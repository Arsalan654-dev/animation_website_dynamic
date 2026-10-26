import { useState } from 'react'
import {
  Check,
  Download,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  MailOpen,
  Palette,
  RotateCcw,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { ImageField } from '@/components/media/ImageField'
import { ThemeTokenEditor } from '@/components/admin/theme/ThemeTokenEditor'
import { ThemePreview } from '@/components/admin/theme/ThemePreview'
import { defaultDesignEffects, defaultDesignPage } from '@/lib/design'
import { defaultThemeTokens, mergeThemeTokens } from '@/lib/theme'
import { assetUrl, cn } from '@/lib/utils'
import type {
  DesignEffects,
  DesignPage,
  DesignSnapshot,
  EnvelopeConfig,
  Invitation,
  InvitationDesignVersion,
  MediaAsset,
  MediaRef,
  Template,
  Theme,
  ThemeTokens,
} from '@/types'

interface StudioPagePanelProps {
  invitation: Invitation
  snapshot: DesignSnapshot
  themes: Theme[]
  templates: Template[]
  mediaAssets: MediaAsset[]
  versions: InvitationDesignVersion[]
  versionsLoading?: boolean
  designName: string
  onDesignNameChange: (name: string) => void
  onChange: (snapshot: DesignSnapshot) => void
  onApplyTheme: (theme: Theme) => void
  onApplyTemplate: (template: Template, mode: 'preserve' | 'replace') => void
  onRestoreVersion: (version: InvitationDesignVersion) => void
  onDownload?: () => void
}

const EFFECT_FIELDS: Array<{ key: keyof DesignEffects; label: string; hint: string }> = [
  { key: 'scroll_reveal', label: 'Scroll reveals', hint: 'Sections arrive as guests scroll.' },
  { key: 'hover_lift', label: 'Hover lift', hint: 'Cards and buttons rise under the pointer.' },
  { key: 'image_zoom', label: 'Image zoom', hint: 'Photographs gently zoom on hover.' },
  { key: 'parallax', label: 'Parallax', hint: 'Cover photographs drift as the page moves.' },
  { key: 'grain', label: 'Paper grain', hint: 'A fine texture over the whole page.' },
  { key: 'sticky_nav', label: 'Sticky navigation', hint: 'Keep the names and RSVP within reach.' },
  { key: 'scroll_progress', label: 'Scroll progress', hint: 'A fine gold line at the top of the page.' },
  { key: 'cursor_glow', label: 'Cursor glow', hint: 'A soft light follows the pointer.' },
]

function envelopeImage(envelope: EnvelopeConfig, slot: 'cover' | 'card' | 'seal'): MediaRef | null {
  return envelope[`${slot}_image` as 'cover_image' | 'card_image' | 'seal_image'] ?? null
}

export function StudioPagePanel({
  invitation,
  snapshot,
  themes,
  templates,
  mediaAssets,
  versions,
  versionsLoading,
  designName,
  onDesignNameChange,
  onChange,
  onApplyTheme,
  onApplyTemplate,
  onRestoreVersion,
  onDownload,
}: StudioPagePanelProps) {
  const [templateMode, setTemplateMode] = useState<'preserve' | 'replace'>('preserve')
  const [showTokens, setShowTokens] = useState(false)

  const theme = themes.find((item) => item.id === snapshot.theme_id) ?? themes[0]
  const tokens = mergeThemeTokens(theme?.tokens ?? defaultThemeTokens, snapshot.design_config.theme_tokens)
  const effects = { ...defaultDesignEffects, ...(snapshot.design_config.effects ?? {}) }
  const page = { ...defaultDesignPage, ...(snapshot.design_config.page ?? {}) }

  const setTokens = (next: ThemeTokens) =>
    onChange({
      ...snapshot,
      design_config: { ...snapshot.design_config, theme_tokens: next },
    })

  const setEffect = (key: keyof DesignEffects, value: boolean) =>
    onChange({
      ...snapshot,
      design_config: {
        ...snapshot.design_config,
        effects: { ...effects, [key]: value },
      },
    })

  const setPage = <K extends keyof DesignPage>(key: K, value: DesignPage[K]) =>
    onChange({
      ...snapshot,
      design_config: {
        ...snapshot.design_config,
        page: { ...page, [key]: value },
      },
    })

  const setEnvelope = <K extends keyof EnvelopeConfig>(key: K, value: EnvelopeConfig[K]) =>
    onChange({ ...snapshot, envelope: { ...snapshot.envelope, [key]: value } })

  const setEnvelopeImage = (slot: 'cover' | 'card' | 'seal', value: MediaRef | null) =>
    onChange({
      ...snapshot,
      envelope: {
        ...snapshot.envelope,
        [`${slot}_media_id`]: value?.mediaId ?? null,
        [`${slot}_image`]: value,
      },
    })

  const useAsPageBackground = (asset: MediaAsset) =>
    setPage('background_image', {
      mediaId: asset.id,
      url: asset.url,
      alt: asset.alt_text,
      width: asset.width,
      height: asset.height,
    })

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <h3 className="mb-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
          Design identity
        </h3>
        <div className="space-y-3">
          <Field label="Design name">
            <Input value={designName} onChange={(event) => onDesignNameChange(event.target.value)} maxLength={120} />
          </Field>
          <p className="text-xs leading-relaxed text-ink/45">
            Designs are save slots. The active design is the one guests see; everything else stays safely in the
            library.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4 text-gold" />
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">Theme</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((item) => {
            const active = snapshot.theme_id === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onApplyTheme(item)}
                className={cn(
                  'relative overflow-hidden rounded-xl border text-left transition',
                  active ? 'border-gold ring-2 ring-gold/25' : 'border-ink/10 hover:border-ink/25',
                )}
              >
                <span
                  className="flex h-16 items-end justify-center pb-2"
                  style={{
                    background: `linear-gradient(135deg, ${item.tokens.colors.primary}, ${item.tokens.colors.accent})`,
                  }}
                >
                  <span className="font-display text-sm text-white/90">{item.name.split(' ')[0]}</span>
                </span>
                <span className="block bg-cream px-2.5 py-2">
                  <span className="block truncate text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-ink/70">
                    {item.name}
                  </span>
                  <span className="mt-1 flex gap-1">
                    {[item.tokens.colors.primary, item.tokens.colors.secondary, item.tokens.colors.accent].map(
                      (color) => (
                        <span
                          key={color}
                          className="h-1.5 w-1.5 rounded-full border border-black/10"
                          style={{ background: color }}
                        />
                      ),
                    )}
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
        <p className="mt-3 text-[0.65rem] leading-relaxed text-ink/40">
          Applying a theme keeps every section, photograph and word in place. Only the visual language changes.
        </p>

        <div className="mt-4">
          <ThemePreview
            tokens={tokens}
            partnerOne={invitation.couple_details.partner_one}
            partnerTwo={invitation.couple_details.partner_two}
            dateLabel={invitation.event?.short_date ?? 'Date to be announced'}
            compact
          />
        </div>

        <button
          type="button"
          onClick={() => setShowTokens((current) => !current)}
          className="mt-4 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink/40 transition hover:text-wine"
        >
          {showTokens ? 'Hide theme tokens' : 'Refine theme tokens'}
        </button>
        {showTokens ? (
          <div className="mt-4 space-y-3">
            <ThemeTokenEditor tokens={tokens} onChange={setTokens} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              onClick={() => setTokens(theme?.tokens ?? defaultThemeTokens)}
            >
              Reset to theme
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-gold" />
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">Template</h3>
        </div>
        <Field label="When applying a template">
          <Select value={templateMode} onChange={(event) => setTemplateMode(event.target.value as 'preserve' | 'replace')}>
            <option value="preserve">Preserve compatible content</option>
            <option value="replace">Replace content with the template</option>
          </Select>
        </Field>
        <p className="mt-2 text-[0.65rem] leading-relaxed text-ink/40">
          {templateMode === 'preserve'
            ? 'Sections keep their words, photographs, styles and animation. The template adds its arrangement and any missing sections.'
            : 'The template arrangement and its content replace the current sections. Your theme and page effects stay.'}
        </p>
        <div className="mt-3 grid gap-2">
          {templates.map((template) => (
            <div key={template.id} className="rounded-xl border border-ink/10 bg-paper/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg leading-tight text-ink">{template.name}</p>
                  <p className="mt-0.5 text-[0.58rem] uppercase tracking-[0.14em] text-ink/35">
                    {template.category} · {Array.isArray(template.layout) ? template.layout.length : template.layout.sections?.length ?? 0} sections
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onApplyTemplate(template, templateMode)}
                >
                  Apply
                </Button>
              </div>
            </div>
          ))}
          {!templates.length ? <p className="text-xs text-ink/40">No templates are available yet.</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">Page effects</h3>
        </div>
        <div className="space-y-1">
          {EFFECT_FIELDS.map((effect) => (
            <div key={effect.key} className="rounded-xl border border-ink/10 bg-paper/50 p-3">
              <Switch
                checked={effects[effect.key]}
                onChange={(value) => setEffect(effect.key, value)}
                label={effect.label}
                hint={effect.hint}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-gold" />
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">Page canvas</h3>
        </div>
        <div className="space-y-3">
          <ImageField
            label="Page background"
            hint="A full-page photograph behind every section."
            aspect="wide"
            value={page.background_image}
            onChange={(value) => setPage('background_image', value)}
          />
          {page.background_image ? (
            <Field label="Background overlay" hint={`${Math.round(page.overlay * 100)}% dark overlay`}>
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={page.overlay}
                onChange={(event) => setPage('overlay', Number(event.target.value))}
                className="w-full accent-[var(--w-accent)]"
              />
            </Field>
          ) : null}
          <Field label="Navigation style">
            <Select value={page.nav_style} onChange={(event) => setPage('nav_style', event.target.value as DesignPage['nav_style'])}>
              <option value="glass">Glass</option>
              <option value="solid">Solid</option>
              <option value="transparent">Transparent</option>
            </Select>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <MailOpen className="h-4 w-4 text-gold" />
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">Envelope</h3>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-ink/10 bg-paper/50 p-3">
            <Switch
              checked={snapshot.envelope.enabled}
              onChange={(value) => setEnvelope('enabled', value)}
              label="Open with an envelope"
              hint="Guests open a sealed invitation before the site appears."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Envelope style">
              <Select value={snapshot.envelope.style} onChange={(event) => setEnvelope('style', event.target.value)}>
                <option value="classic">Classic</option>
                <option value="wax">Wax seal</option>
                <option value="botanical">Botanical</option>
                <option value="minimal">Minimal</option>
                <option value="gilded">Gilded</option>
              </Select>
            </Field>
            <Field label="Monogram">
              <Input value={snapshot.envelope.monogram} onChange={(event) => setEnvelope('monogram', event.target.value)} />
            </Field>
            <Field label="Seal text">
              <Input value={snapshot.envelope.seal_text} onChange={(event) => setEnvelope('seal_text', event.target.value)} />
            </Field>
            <Field label="Opening prompt">
              <Input value={snapshot.envelope.prompt} onChange={(event) => setEnvelope('prompt', event.target.value)} />
            </Field>
            <Field label="Card message" className="sm:col-span-2">
              <Input value={snapshot.envelope.card_message} onChange={(event) => setEnvelope('card_message', event.target.value)} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ImageField
              label="Envelope cover"
              aspect="portrait"
              value={envelopeImage(snapshot.envelope, 'cover')}
              onChange={(value) => setEnvelopeImage('cover', value)}
            />
            <ImageField
              label="Invitation card"
              aspect="portrait"
              value={envelopeImage(snapshot.envelope, 'card')}
              onChange={(value) => setEnvelopeImage('card', value)}
            />
            <ImageField
              label="Wax seal"
              aspect="square"
              value={envelopeImage(snapshot.envelope, 'seal')}
              onChange={(value) => setEnvelopeImage('seal', value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-gold" />
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">Footer & contact</h3>
        </div>
        <p className="text-[0.65rem] leading-relaxed text-ink/45">
          The closing footer uses the couple names, date, venue, hashtag and message from the invitation details. Those
          stay shared across every design; edit them in the invitation overview. The footer follows the theme, page
          background and effects shown here.
        </p>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-gold" />
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">Cover photograph</h3>
        </div>
        <ImageField
          label="Cover image"
          hint="Used by the hero when a section has no background of its own."
          aspect="wide"
          value={snapshot.cover_image_path ? { url: snapshot.cover_image_path, alt: invitation.title } : null}
          onChange={(value) => onChange({ ...snapshot, cover_image_path: value?.url ?? null })}
        />
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-gold" />
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">Media library</h3>
        </div>
        <p className="mb-3 text-[0.65rem] leading-relaxed text-ink/40">
          Every image field opens the full library. These are the most recent uploads; choose one for the page background.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {mediaAssets.slice(0, 12).map((asset) => {
            const url = assetUrl(asset.url)
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => useAsPageBackground(asset)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-ink/10 bg-paper"
                title={`Use ${asset.original_name} as the page background`}
              >
                {url ? <img src={url} alt={asset.alt_text ?? ''} className="h-full w-full object-cover" /> : null}
                <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-cream opacity-0 transition group-hover:opacity-100">
                  Use as page
                </span>
              </button>
            )
          })}
        </div>
        {!mediaAssets.length ? <p className="text-xs text-ink/40">The media library is empty.</p> : null}
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-gold" />
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">Custom CSS</h3>
        </div>
        <Textarea
          rows={6}
          value={snapshot.design_config.custom_css ?? ''}
          onChange={(event) =>
            onChange({
              ...snapshot,
              design_config: { ...snapshot.design_config, custom_css: event.target.value },
            })
          }
          placeholder=".inv-hero-name { letter-spacing: 0.02em; }"
          className="font-mono text-[0.7rem]"
        />
        <p className="mt-2 text-[0.62rem] leading-relaxed text-ink/40">
          A small escape hatch for advanced typography and spacing. It is included in the standalone export.
        </p>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">Versions</h3>
          {onDownload ? (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1 text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-ink/40 transition hover:text-wine"
            >
              <Download className="h-3 w-3" /> Export
            </button>
          ) : null}
        </div>
        <p className="mb-3 text-[0.65rem] leading-relaxed text-ink/40">
          Every save records a version. Restoring a version updates this design and the live invitation.
        </p>
        {versionsLoading ? (
          <p className="text-xs text-ink/40">Loading versions…</p>
        ) : versions.length ? (
          <div className="space-y-2">
            {versions.slice(0, 8).map((version) => (
              <div key={version.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-paper/50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink/70">
                    v{version.version} · {version.label ?? 'Design save'}
                  </p>
                  <p className="text-[0.55rem] uppercase tracking-[0.12em] text-ink/35">
                    {version.created_at ? new Date(version.created_at).toLocaleString() : ''}
                    {version.created_by?.name ? ` · ${version.created_by.name}` : ''}
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => onRestoreVersion(version)}>
                  Restore
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink/40">No versions yet. Save the design to create the first one.</p>
        )}
      </section>
    </div>
  )
}
