import { useState } from 'react'
import { AlignCenter, AlignLeft, Copy, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Switch } from '@/components/ui/Field'
import { ImageField } from '@/components/media/ImageField'
import { ColorControl } from '@/components/studio/ComponentFields'
import { defaultSectionDesign } from '@/lib/componentRegistry'
import { asBoolean, asNumber, asString } from '@/lib/object'
import { cn } from '@/lib/utils'
import type { DesignSnapshotSection, MediaRef, SectionDesign } from '@/types'

interface StudioStylePanelProps {
  section: DesignSnapshotSection
  onChange: (section: DesignSnapshotSection, options?: { force?: boolean }) => void
  onApplyStyleToAll?: (design: SectionDesign) => void
}

export function StudioStylePanel({ section, onChange, onApplyStyleToAll }: StudioStylePanelProps) {
  const [applyAllOpen, setApplyAllOpen] = useState(false)
  const design = (section.design ?? {}) as SectionDesign
  const background = (design.background_image ?? null) as MediaRef | null

  const setDesign = (key: keyof SectionDesign, value: unknown, force = false) => {
    onChange({ ...section, design: { ...design, [key]: value } }, { force })
  }

  const reset = () => {
    onChange({ ...section, design: defaultSectionDesign() }, { force: true })
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gold" />
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
            Layout & visibility
          </h3>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-ink/10 bg-paper/50 p-3">
            <Switch
              checked={section.is_visible}
              onChange={(value) => onChange({ ...section, is_visible: value }, { force: true })}
              label="Show this section"
              hint="Hidden sections stay saved but do not appear on the live invitation."
            />
          </div>

          <Field label="Content alignment">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDesign('align', 'center', true)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition',
                  (design.align ?? 'center') === 'center'
                    ? 'border-gold bg-gold/10 text-ink'
                    : 'border-ink/10 bg-cream text-ink/50 hover:border-ink/20',
                )}
              >
                <AlignCenter className="h-3.5 w-3.5" /> Center
              </button>
              <button
                type="button"
                onClick={() => setDesign('align', 'left', true)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition',
                  design.align === 'left'
                    ? 'border-gold bg-gold/10 text-ink'
                    : 'border-ink/10 bg-cream text-ink/50 hover:border-ink/20',
                )}
              >
                <AlignLeft className="h-3.5 w-3.5" /> Left
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Vertical spacing" hint="Pixels">
              <Input
                type="number"
                min={0}
                max={240}
                step={4}
                value={asNumber(design.padding_y, 96)}
                onChange={(event) => setDesign('padding_y', Number(event.target.value))}
              />
            </Field>
            <Field label="Content width" hint="Pixels">
              <Input
                type="number"
                min={480}
                max={1600}
                step={20}
                value={asNumber(design.max_width, 1160)}
                onChange={(event) => setDesign('max_width', Number(event.target.value))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['hide_on_mobile', 'Mobile'],
                ['hide_on_tablet', 'Tablet'],
                ['hide_on_desktop', 'Desktop'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDesign(key, !asBoolean(design[key]), true)}
                className={cn(
                  'rounded-lg border px-2 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.1em] transition',
                  asBoolean(design[key])
                    ? 'border-[#9b3434]/30 bg-[#9b3434]/10 text-[#8c2d2d]'
                    : 'border-ink/10 bg-cream text-ink/45 hover:border-ink/20',
                )}
              >
                Hide {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <h3 className="mb-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
          Surface
        </h3>
        <div className="space-y-3">
          <Field label="Background colour" hint="Leave empty to inherit the theme surface.">
            <ColorControl
              value={design.background_color ?? ''}
              onChange={(value) => setDesign('background_color', value || undefined)}
            />
          </Field>
          <Field label="Text colour" hint="Leave empty to inherit the theme typography.">
            <ColorControl
              value={design.text_color ?? ''}
              onChange={(value) => setDesign('text_color', value || undefined)}
            />
          </Field>

          <ImageField
            label="Background image"
            hint="A full-width photograph behind this section."
            aspect="wide"
            value={background}
            onChange={(value) => setDesign('background_image', value, true)}
          />

          {background ? (
            <Field label="Image overlay" hint={`${Math.round(asNumber(design.overlay, 0) * 100)}% dark overlay`}>
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={asNumber(design.overlay, 0)}
                onChange={(event) => setDesign('overlay', Number(event.target.value))}
                className="w-full accent-[var(--w-accent)]"
              />
            </Field>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <h3 className="mb-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
          Interaction
        </h3>
        <Field label="Hover effect" hint="A subtle response when a guest points at this section.">
          <Select
            value={asString(design.hover_effect, 'none')}
            onChange={(event) => setDesign('hover_effect', event.target.value, true)}
          >
            <option value="none">None</option>
            <option value="lift">Lift cards</option>
            <option value="zoom">Zoom photographs</option>
            <option value="glow">Golden glow</option>
          </Select>
        </Field>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={reset}>
          Reset style
        </Button>
        {onApplyStyleToAll ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Copy className="h-3.5 w-3.5" />}
            onClick={() => setApplyAllOpen((current) => !current)}
          >
            Copy to all
          </Button>
        ) : null}
      </div>

      {applyAllOpen && onApplyStyleToAll ? (
        <div className="rounded-xl border border-gold/25 bg-gold/[0.06] p-3">
          <p className="text-xs leading-relaxed text-ink/55">
            Copy this section&apos;s surface, spacing and responsive visibility to every other section. Content and
            animation settings stay untouched.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setApplyAllOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onApplyStyleToAll(design)
                setApplyAllOpen(false)
              }}
            >
              Copy style
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
