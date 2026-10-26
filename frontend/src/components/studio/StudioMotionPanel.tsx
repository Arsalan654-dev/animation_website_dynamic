import { RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Switch } from '@/components/ui/Field'
import { asBoolean, asNumber, asString } from '@/lib/object'
import { cn } from '@/lib/utils'
import type { AnimationConfig, AnimationPreset, DesignSnapshot, DesignSnapshotSection } from '@/types'

interface AnimationConfigFieldsProps {
  config: AnimationConfig
  onChange: (key: keyof AnimationConfig, value: unknown) => void
  compact?: boolean
}

function AnimationConfigFields({ config, onChange, compact = false }: AnimationConfigFieldsProps) {
  return (
    <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'sm:grid-cols-2')}>
      <Field label="Duration" hint="Seconds · 0.1–10">
        <Input
          type="number"
          min={0.1}
          max={10}
          step={0.1}
          value={asNumber(config.duration, 0.8)}
          onChange={(event) => onChange('duration', Number(event.target.value))}
        />
      </Field>
      <Field label="Delay" hint="Seconds · 0–5">
        <Input
          type="number"
          min={0}
          max={5}
          step={0.05}
          value={asNumber(config.delay, 0.05)}
          onChange={(event) => onChange('delay', Number(event.target.value))}
        />
      </Field>
      <Field label="Easing">
        <Select
          value={asString(config.easing, 'easeOut')}
          onChange={(event) => onChange('easing', event.target.value)}
        >
          <option value="easeOut">Ease out</option>
          <option value="easeIn">Ease in</option>
          <option value="easeInOut">Ease in out</option>
          <option value="linear">Linear</option>
          <option value="spring">Spring</option>
        </Select>
      </Field>
      <Field label="Direction">
        <Select
          value={asString(config.direction, 'up')}
          onChange={(event) => onChange('direction', event.target.value)}
        >
          <option value="up">Up</option>
          <option value="down">Down</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </Select>
      </Field>
      <Field label="Distance" hint="Pixels · 0–200">
        <Input
          type="number"
          min={0}
          max={200}
          step={1}
          value={asNumber(config.distance, 40)}
          onChange={(event) => onChange('distance', Number(event.target.value))}
        />
      </Field>
      <Field label="Scale" hint="0.5–1.5">
        <Input
          type="number"
          min={0.5}
          max={1.5}
          step={0.01}
          value={asNumber(config.scale, 1)}
          onChange={(event) => onChange('scale', Number(event.target.value))}
        />
      </Field>
      <Field label="Stagger" hint="Seconds between items">
        <Input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={asNumber(config.stagger, 0.12)}
          onChange={(event) => onChange('stagger', Number(event.target.value))}
        />
      </Field>
      <Field label="Parallax depth" hint="0–1">
        <Input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={asNumber(config.parallax, 0.18)}
          onChange={(event) => onChange('parallax', Number(event.target.value))}
        />
      </Field>
      <Field label="Reduced motion">
        <Select
          value={asString(config.reduced_motion, 'fade')}
          onChange={(event) => onChange('reduced_motion', event.target.value)}
        >
          <option value="fade">Fade instead</option>
          <option value="none">No motion</option>
        </Select>
      </Field>
      <div className="flex flex-col gap-2 rounded-xl border border-ink/10 bg-paper/50 p-3">
        <Switch
          checked={asBoolean(config.once, true)}
          onChange={(value) => onChange('once', value)}
          label="Reveal once"
          hint="Keep the section visible after its first reveal."
        />
        <Switch
          checked={asBoolean(config.mobile, true)}
          onChange={(value) => onChange('mobile', value)}
          label="Animate on mobile"
        />
      </div>
    </div>
  )
}

interface StudioMotionPanelProps {
  snapshot: DesignSnapshot
  section?: DesignSnapshotSection | null
  presets: AnimationPreset[]
  onSectionChange?: (section: DesignSnapshotSection, options?: { force?: boolean }) => void
  onPageChange: (snapshot: DesignSnapshot) => void
}

export function StudioMotionPanel({
  snapshot,
  section,
  presets,
  onSectionChange,
  onPageChange,
}: StudioMotionPanelProps) {
  if (section && onSectionChange) {
    const config = (section.animation_config ?? {}) as AnimationConfig
    const preset = presets.find((item) => item.id === section.animation_preset_id)

    const setConfig = (key: keyof AnimationConfig, value: unknown) => {
      onSectionChange(
        {
          ...section,
          animation_config: { ...config, [key]: value },
        },
        { force: key === 'disabled' || key === 'once' || key === 'mobile' },
      )
    }

    return (
      <div className="space-y-5">
        <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
              Section movement
            </h3>
          </div>
          <div className="space-y-3">
            <Field label="Animation preset" hint="Presets set the base movement; overrides below refine it.">
              <Select
                value={preset ? String(preset.id) : ''}
                onChange={(event) => {
                  const id = event.target.value ? Number(event.target.value) : null
                  onSectionChange({ ...section, animation_preset_id: id }, { force: true })
                }}
              >
                <option value="">Inherit from page / theme</option>
                {presets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="rounded-xl border border-ink/10 bg-paper/50 p-3">
              <Switch
                checked={!asBoolean(config.disabled)}
                onChange={(value) => setConfig('disabled', !value)}
                label="Animate this section"
                hint="When off, the content appears immediately without movement."
              />
            </div>

            <AnimationConfigFields config={config} onChange={setConfig} />
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={() =>
              onSectionChange(
                { ...section, animation_preset_id: null, animation_config: null },
                { force: true },
              )
            }
          >
            Inherit everything
          </Button>
        </div>

        <p className="rounded-xl border border-gold/20 bg-gold/[0.06] p-3 text-xs leading-relaxed text-ink/50">
          The canvas keeps sections still while you edit. Use <strong className="font-semibold text-ink/70">Preview</strong>{' '}
          in the top bar to watch the full motion language.
        </p>
      </div>
    )
  }

  const pageAnimation = snapshot.design_config.animation ?? {}
  const overrides = (pageAnimation.overrides ?? {}) as AnimationConfig

  const setPageAnimation = (next: typeof pageAnimation) => {
    onPageChange({
      ...snapshot,
      design_config: {
        ...snapshot.design_config,
        animation: next,
      },
    })
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/50">
            Page movement
          </h3>
        </div>
        <div className="space-y-3">
          <Field label="Default animation preset" hint="Sections inherit this unless they choose their own.">
            <Select
              value={pageAnimation.preset ?? ''}
              onChange={(event) =>
                setPageAnimation({ ...pageAnimation, preset: event.target.value || null })
              }
            >
              <option value="">Use the theme default</option>
              {presets.map((preset) => (
                <option key={preset.slug} value={preset.slug}>
                  {preset.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="rounded-xl border border-ink/10 bg-paper/50 p-3">
            <Switch
              checked={!pageAnimation.disabled}
              onChange={(value) => setPageAnimation({ ...pageAnimation, disabled: !value })}
              label="Animate the invitation"
              hint="A single switch for the whole page."
            />
          </div>

          <AnimationConfigFields
            config={overrides}
            onChange={(key, value) =>
              setPageAnimation({ ...pageAnimation, overrides: { ...overrides, [key]: value } })
            }
          />
        </div>
      </section>

      <Button
        type="button"
        variant="outline"
        size="sm"
        icon={<RotateCcw className="h-3.5 w-3.5" />}
        onClick={() => setPageAnimation({ preset: null, disabled: false, overrides: {} })}
      >
        Reset page movement
      </Button>
    </div>
  )
}
